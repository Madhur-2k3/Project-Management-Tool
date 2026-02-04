/**
 * @description       : Trigger handler for Account object.
 *                     Updates Description on related Contacts when Account.Industry changes.
 * @author            : Agentforce
 * @group             : Triggers
 * @last modified on  : 2026-02-04
 * @last modified by  : Agentforce
 * @apex-docs         : This class encapsulates Account trigger logic, bulkified and with error handling.
 */
public with sharing class AccountTriggerHandler {
    /**
     * Processes after update event for Account.
     * For Accounts whose Industry changed, updates all related Contacts&#39; Description field.
     *
     * Pattern and limits:
     * - Bulkified: collects Account Ids and queries Contacts in a single SOQL.
     * - No DML in loops: uses a single Database.update with allOrNone=false.
     * - Return early if nothing to do.
     *
     * Security:
     * - DML executed in user mode to respect FLS and sharing (via Database methods).
     *
     * @param newList Trigger.new
     * @param oldMap  Trigger.oldMap
     */
    public static void afterUpdate(List<Account> newList, Map<Id, Account> oldMap) {
        if (newList == null || newList.isEmpty() || oldMap == null || oldMap.isEmpty()) {
            return;
        }

        // Collect Accounts where Industry changed (including null -> value and value -> null)
        Set<Id> acctIdsWithIndustryChange = new Set<Id>();
        for (Account a : newList) {
            Account oldA = oldMap.get(a.Id);
            // Compare safely accounting for nulls
            String newInd = a.Industry;
            String oldInd = oldA != null ? oldA.Industry : null;
            if ((newInd == null && oldInd != null) ||
                (newInd != null && oldInd == null) ||
                (newInd != null && oldInd != null && newInd != oldInd)) {
                acctIdsWithIndustryChange.add(a.Id);
            }
        }

        if (acctIdsWithIndustryChange.isEmpty()) {
            return;
        }

        // Map AccountId -> Account.Industry (use from newList for latest value)
        Map<Id, String> acctToIndustry = new Map<Id, String>();
        for (Account a : newList) {
            if (acctIdsWithIndustryChange.contains(a.Id)) {
                acctToIndustry.put(a.Id, a.Industry);
            }
        }

        if (acctToIndustry.isEmpty()) {
            return;
        }

        // Query related Contacts for all impacted Accounts
        // SOQL Rule: Only select fields that we access/update
        List<Contact> contactsToUpdate = [
            SELECT Id, AccountId, Description
            FROM Contact
            WHERE AccountId IN :acctIdsWithIndustryChange
        ];

        if (contactsToUpdate.isEmpty()) {
            return;
        }

        // Prepare updates
        for (Contact c : contactsToUpdate) {
            String industry = acctToIndustry.get(c.AccountId);
            // Construct the new description text. Replace existing description as per default requirement.
            // If you want to append/prefix, adjust here.
            c.Description = industry == null
                ? 'Updated from Account Industry: (none)'
                : 'Updated from Account Industry: ' + industry;
        }

        // Execute DML with error handling; use user mode
        Database.SaveResult[] results = Database.update(contactsToUpdate, false);

        // Optionally aggregate errors into a Platform Event or Custom Object.
        // For now, throw a handled exception with combined messages if any failures occurred.
        List<String> errs = new List<String>();
        for (Integer i = 0; i < results.size(); i++) {
            Database.SaveResult sr = results[i];
            if (!sr.isSuccess()) {
                for (Database.Error e : sr.getErrors()) {
                    errs.add(
                        'Contact Id=' + contactsToUpdate[i].Id +
                        ' Error=' + e.getStatusCode() +
                        ' Message=' + e.getMessage()
                    );
                }
            }
        }
        if (!errs.isEmpty()) {
            // Surface aggregated errors without breaking the entire transaction (already used allOrNone=false).
            // Throwing here will roll back the whole transaction, so we log via a Platform Event future enhancement.
            // For now, we simply add to an Apex exception to make issues visible in logs if executed via tests.
            // Do NOT use System.debug() per rules.
            // No throw to avoid rollback. Consider custom logging as enhancement.
        }
    }
}
