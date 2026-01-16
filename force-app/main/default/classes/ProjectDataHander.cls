public with sharing class ProjectDataHander {
    @AuraEnabled
    public static Integer getTotalProjects() {
        return [SELECT COUNT() FROM Project__c];
    }
    @AuraEnabled
    public static List<Project__c> getAllProjects() {
        return [SELECT Id,Name,Project_Name__c,Description__c,Start_Date__c,End_Date__c,Status__c,Milestone__c  FROM Project__c];
    }
    //get project details by id
    @AuraEnabled(Cacheable=true)
    public static Project__c getProjectDetailsById(Id projectId) {
        return [SELECT Id,Name,Project_Name__c,Description__c,Start_Date__c,End_Date__c,Status__c,Milestone__c  FROM Project__c WHERE Id = :projectId LIMIT 1];
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
    @AuraEnabled
    public static List<Project_Member__c> getTeamMembersByProjectId(Id projectId) {
        return [SELECT Id,Employee__r.Name,Employee__r.Email__c,Employee__r.Role__c  FROM Project_Member__c WHERE Project__c = :projectId];
    }
    //get all employees excluding current project members
    @AuraEnabled
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
    //add Employee to Project
    @AuraEnabled
    public static void addEmployeeToProject(Id projectId, List<Id> employeeIds) {
        List<Project_Member__c> newMembers = new List<Project_Member__c>();
        for(Id empId : employeeIds) {
            Project_Member__c pm = new Project_Member__c();
            pm.Project__c = projectId;
            pm.Employee__c = empId;
            newMembers.add(pm);
        }
        if(!newMembers.isEmpty()) {
            insert newMembers;
        }

    } 
    //remove Employee from Project
    @AuraEnabled
    public static void removeEmployeeFromProject(List<Id> projectMemberIds) {
        List<Project_Member__c> membersToRemove = [SELECT Id FROM Project_Member__c WHERE Id IN :projectMemberIds];
        if(!membersToRemove.isEmpty()) {
            delete membersToRemove;
        }
    }
    //delete project by id
    @AuraEnabled
    public static void deleteProjectById(Id projectId) {
        Project__c projectToDelete = [SELECT Id FROM Project__c WHERE Id = :projectId LIMIT 1];
        delete projectToDelete;
    }

}