/**
 * @description       : Utility class to print parent Account Names for a list of Opportunities.
 * Notes:
 * - Per SOQL coverage rules, MUST query Account.Name via relationship in SELECT when accessing opp.Account.Name
 * - Uses System.debug ONLY in this isolated utility for demonstration; remove in production per org standards.
 */
public with sharing class OpportunityAccountPrinter {
    /**
     * Prints the parent Account Name for each Opportunity in the provided list.
     * Queries the necessary relationship field to avoid runtime field coverage errors.
     *
     * @param opportunityIds List of Opportunity Ids to process
     */
    public static void printParentAccountNames(List<Id> opportunityIds) {
        if (opportunityIds == null || opportunityIds.isEmpty()) {
            return; // Return early
        }

        // Query Opportunities including parent Account.Name to safely access it later.
        // Rule 2 from vibes: include relationship fields in SELECT when traversing.
        List<Opportunity> opps = [
            SELECT Id, Name, AccountId, Account.Name
            FROM Opportunity
            WHERE Id IN :opportunityIds
        ];

        // Iterate and print. Guard nulls: Account can be null on an Opportunity.
        for (Opportunity opp : opps) {
            String acctName = (opp.Account != null) ? opp.Account.Name : '(no account)';
            System.debug('Opportunity ' + opp.Id + ' - Account Name: ' + acctName);
        }
    }

    /**
     * Convenience overload to print for all Opportunities in the org (LIMIT to a reasonable number).
     * WARNING: Intended for quick demos. Avoid in production for large data volumes.
     */
    public static void printAllParentAccountNames(Integer limitSize) {
        Integer effectiveLimit = (limitSize == null || limitSize <= 0) ? 100 : Math.min(limitSize, 1000);
        List<Opportunity> opps = [
            SELECT Id, Name, AccountId, Account.Name
            FROM Opportunity
            LIMIT :effectiveLimit
        ];
        for (Opportunity opp : opps) {
            String acctName = (opp.Account != null) ? opp.Account.Name : '(no account)';
            System.debug('Opportunity ' + opp.Id + ' - Account Name: ' + acctName);
        }
    }
}
