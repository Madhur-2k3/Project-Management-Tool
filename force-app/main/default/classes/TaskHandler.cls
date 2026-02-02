public with sharing class TaskHandler {
    // get tasks by project id
    @AuraEnabled
    public static List<Task__c> getTasksByProjectId(Id projectId) {
        return [SELECT Id, Name, Description__c, Assigned_to__c, Assigned_to__r.Name, Due_Date__c, Priority__c, Status__c, Project__c, Sub_Task__c, RecordType.Name, RecordTypeId FROM Task__c WHERE Project__c = :projectId];
    }
    
    // Get all record types for Task__c (for Epic tabs)
    @AuraEnabled(cacheable=true)
    public static List<RecordType> getTaskRecordTypes() {
        return [SELECT Id, Name, DeveloperName FROM RecordType WHERE SObjectType = 'Task__c' AND IsActive = true];
    }
    // update task status
    @AuraEnabled
    public static void updateTaskStatus(Id taskId, String newStatus) {
        Task__c taskToUpdate = [SELECT Id, Status__c FROM Task__c WHERE Id = :taskId LIMIT 1];
        taskToUpdate.Status__c = newStatus;
        update taskToUpdate;
    }
    
    // delete task
    @AuraEnabled
    public static void deleteTask(Id taskId) {
        Task__c taskToDelete = [SELECT Id FROM Task__c WHERE Id = :taskId LIMIT 1];
        delete taskToDelete;
    }
}
