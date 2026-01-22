public with sharing class TeamMemberHandler {
    
    // get team members by project id
    @AuraEnabled
    public static List<Project_Member__c> getTeamMembersByProjectId(Id projectId) {
        return [SELECT Id, Employee__c, Employee__r.Name, Employee__r.Email__c, Employee__r.Role__c FROM Project_Member__c WHERE Project__c = :projectId];
    }
    // get all employees excluding those already assigned to the project
    @AuraEnabled
    public static List<Employee__c> getAllEmployeesExcludingProjectMembers(Id projectId) {
        Set<Id> memberIds = new Set<Id>();
        for (Project_Member__c pm : [SELECT Employee__c FROM Project_Member__c WHERE Project__c = :projectId]) {
            memberIds.add(pm.Employee__c);
        }
        return [SELECT Id, Name, Email__c, Role__c FROM Employee__c WHERE Id NOT IN :memberIds];
    }
    // add employees to project
    @AuraEnabled
    public static void addEmployeeToProject(Id projectId, List<Id> employeeIds) {
        List<Project_Member__c> newMembers = new List<Project_Member__c>();
        for (Id empId : employeeIds) {
            Project_Member__c pm = new Project_Member__c();
            pm.Project__c = projectId;
            pm.Employee__c = empId;
            newMembers.add(pm);
        }
        if (!newMembers.isEmpty()) {
            insert newMembers;
        }
    }
    // remove employees from project
    @AuraEnabled
    public static void removeEmployeeFromProject(List<Id> projectMemberIds) {
        List<Project_Member__c> membersToRemove = [SELECT Id FROM Project_Member__c WHERE Id IN :projectMemberIds];
        if (!membersToRemove.isEmpty()) {
            delete membersToRemove;
        }
    }
}
