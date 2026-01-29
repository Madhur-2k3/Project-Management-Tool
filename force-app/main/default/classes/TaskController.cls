public with sharing class TaskController {
    
        @AuraEnabled(cacheable=true)
        public static List<Task__c> getParentTasks(String projectId, String currentRecordTypeId) {
        // Get the current record type name to exclude tasks of the same type
        String currentRecordTypeName = '';
        if (String.isNotBlank(currentRecordTypeId)) {
            RecordType rt = [SELECT Name FROM RecordType WHERE Id = :currentRecordTypeId LIMIT 1];
            currentRecordTypeName = rt.Name;
        }
        
        // Query tasks that can be parent tasks (different record type, same project)
        // For SubTask, show Epic tasks; Epic tasks don't need parent
        List<Task__c> parentTasks = [
            SELECT Id, Name, RecordType.Name
            FROM Task__c
            WHERE Project__c = :projectId
            AND RecordType.Name != :currentRecordTypeName
            ORDER BY Name ASC
            LIMIT 200
        ];
        
        return parentTasks;
    }

    @AuraEnabled
    public static List<Employee__c> getProjectEmployees(String projectId) {
        // Get all employees who are members of this project
        Set<Id> employeeIds = new Set<Id>();
        for (Project_Member__c pm : [SELECT Employee__c FROM Project_Member__c WHERE Project__c = :projectId]) {
            employeeIds.add(pm.Employee__c);
        }
        
        if (employeeIds.isEmpty()) {
            return new List<Employee__c>();
        }
        
        return [
            SELECT Id, Name, Role__c
            FROM Employee__c
            WHERE Id IN :employeeIds
            ORDER BY Name ASC
        ];
    }
}
