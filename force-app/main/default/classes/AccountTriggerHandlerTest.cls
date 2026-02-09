/**
 * @description       : Unit tests for AccountTriggerHandler and AccountTrigger
 * Verifies that when Account.Industry changes, related Contacts' Description is updated.
 */
@IsTest
private class AccountTriggerHandlerTest {
    @TestSetup
    static void setupData() {
        // Create Accounts
        List<Account> accs = new List<Account>{
            new Account(Name = 'Acme A', Industry = 'Energy'),
            new Account(Name = 'Acme B', Industry = 'Banking')
        };
        insert accs;

        // Create Contacts related to those Accounts
        List<Contact> cons = new List<Contact>{
            new Contact(LastName = 'Alpha', AccountId = accs[0].Id),
            new Contact(LastName = 'Beta', AccountId = accs[0].Id),
            new Contact(LastName = 'Gamma', AccountId = accs[1].Id)
        };
        insert cons;
    }

    @IsTest
    static void test_UpdateDescriptions_WhenIndustryChanges() {
        // Query setup data
        List<Account> accs = [SELECT Id, Name, Industry FROM Account ORDER BY Name LIMIT 2];
        System.assertEquals(2, accs.size(), 'Expected 2 Accounts from setup');

        // Change Industry on both accounts to trigger child Contact updates
        for (Account a : accs) {
            a.Industry = a.Industry == 'Energy' ? 'Technology' : 'Manufacturing';
        }

        Test.startTest();
        update accs;
        Test.stopTest();

        // Verify Contacts updated with the new description
        Map<Id, String> acctToIndustry = new Map<Id, String>();
        for (Account a : [SELECT Id, Industry FROM Account WHERE Id IN :accs]) {
            acctToIndustry.put(a.Id, a.Industry);
        }

        List<Contact> updatedContacts = [
            SELECT Id, AccountId, Description
            FROM Contact
            WHERE AccountId IN :acctToIndustry.keySet()
        ];
        System.assertNotEquals(0, updatedContacts.size(), 'Expected contacts to be present');

        for (Contact c : updatedContacts) {
            String expected = 'Updated from Account Industry: ' + (acctToIndustry.get(c.AccountId) == null ? '(none)' : acctToIndustry.get(c.AccountId));
            System.assertEquals(expected, c.Description, 'Contact description should match expected format');
        }
    }

    @IsTest
    static void test_NoUpdate_WhenIndustryUnchanged() {
        // Update Accounts without changing Industry
        List<Account> accs = [SELECT Id, Name, Industry FROM Account ORDER BY Name LIMIT 2];

        Test.startTest();
        update accs; // no changes
        Test.stopTest();

        // Ensure no description overwrite happened unexpectedly by setting baseline then re-run
        // First set a baseline description
        List<Contact> contacts = [SELECT Id, AccountId, Description FROM Contact WHERE AccountId IN :new Map<Id, Account>(accs).keySet()];
        for (Contact c : contacts) {
            c.Description = 'Baseline';
        }
        update contacts;

        // Update accounts again without changing Industry
        Test.startTest();
        update accs; // still unchanged industry
        Test.stopTest();

        // Verify descriptions remain baseline
        List<Contact> contactsAfter = [SELECT Id, AccountId, Description FROM Contact WHERE Id IN :new Map<Id, Contact>(contacts).keySet()];
        for (Contact c : contactsAfter) {
            System.assertEquals('Baseline', c.Description, 'Description should remain unchanged if Industry did not change');
        }
    }

    @IsTest
    static void test_HandleNullIndustryTransitions() {
        // Create account with null industry and related contact
        Account a = new Account(Name = 'Null Industry Co');
        insert a;

        Contact c = new Contact(LastName = 'NullInd', AccountId = a.Id);
        insert c;

        // Transition null -> value
        a = [SELECT Id, Industry FROM Account WHERE Id = :a.Id LIMIT 1];
        a.Industry = 'Healthcare';

        Test.startTest();
        update a;
        Test.stopTest();

        Contact c1 = [SELECT Id, Description FROM Contact WHERE Id = :c.Id LIMIT 1];
        System.assertEquals('Updated from Account Industry: Healthcare', c1.Description, 'Description should update for null -> value');

        // Transition value -> null
        a = [SELECT Id, Industry FROM Account WHERE Id = :a.Id LIMIT 1];
        a.Industry = null;

        Test.startTest();
        update a;
        Test.stopTest();

        Contact c2 = [SELECT Id, Description FROM Contact WHERE Id = :c.Id LIMIT 1];
        System.assertEquals('Updated from Account Industry: (none)', c2.Description, 'Description should update for value -> null');
    }
}
