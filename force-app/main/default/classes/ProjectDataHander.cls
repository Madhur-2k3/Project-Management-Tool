public with sharing class ProjectDataHander {
    @AuraEnabled
    public static Integer getTotalProjects() {
        return [SELECT COUNT() FROM Project__c];
    }
    @AuraEnabled(cacheable=true)
    public static List<Project__c> getAllProjects() {
        return [SELECT Id,Name,Description__c,Start_Date__c,End_Date__c,Status__c,Milestone__c  FROM Project__c];
    }
}