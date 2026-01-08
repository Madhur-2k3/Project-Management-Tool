public with sharing class ProjectDataHander {
    @AuraEnabled
    public static Integer getTotalProjects() {
        return [SELECT COUNT() FROM Project__c];
    }
    @AuraEnabled(cacheable=true)
    public static List<Project__c> getAllProjects() {
        return [SELECT Id,Name,Project_Name__c,Description__c,Start_Date__c,End_Date__c,Status__c,Milestone__c  FROM Project__c];
    }
    //get user details
    @AuraEnabled
    public static User getUserDetails() {
        return [SELECT Id,Name,Username,Profile.Name,UserRole.Name FROM User WHERE Id = :UserInfo.getUserId()];
    }
    //get tasks by project id
    @AuraEnabled(cacheable=true)
    public static List<Task__c> getTasksByProjectId(Id projectId) {
        return [SELECT Id,Name,Description__c, Assigned_to__c,Due_Date__c,Priority__c,Status__c,Project__c,Sub_Task__c FROM Task__c WHERE Project__c = :projectId];
    }
}