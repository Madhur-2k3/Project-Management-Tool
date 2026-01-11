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
    @AuraEnabled
    public static List<Task__c> getTasksByProjectId(Id projectId) {
        return [SELECT Id,Name,Description__c, Assigned_to__c,Due_Date__c,Priority__c,Status__c,Project__c,Sub_Task__c FROM Task__c WHERE Project__c = :projectId];
    }
    //get team members by project id
    @AuraEnabled(cacheable=true)
    public static List<Project_Member__c> getTeamMembersByProjectId(Id projectId) {
        return [SELECT Id,Employee__r.Name,Employee__r.Email__c,Employee__r.Role__c  FROM Project_Member__c WHERE Project__c = :projectId];
    }
    //get all employees excluding current project members
    @AuraEnabled(cacheable=true)
    public static List<Employee__c> getAllEmployeesExcludingProjectMembers(Id projectId) {
        Set<Id> memberIds = new Set<Id>();
        for(Project_Member__c pm : [SELECT Employee__c FROM Project_Member__c WHERE Project__c = :projectId]) {
            memberIds.add(pm.Employee__c);
        }
        return [SELECT Id, Name, Email__c, Role__c FROM Employee__c WHERE Id NOT IN :memberIds];
    }
    //update task status
    @AuraEnabled
    public static void updateTaskStatus(Id taskId, String newStatus) {
        Task__c taskToUpdate = [SELECT Id, Status__c FROM Task__c WHERE Id = :taskId LIMIT 1];
        taskToUpdate.Status__c = newStatus;
        update taskToUpdate;
    }

}