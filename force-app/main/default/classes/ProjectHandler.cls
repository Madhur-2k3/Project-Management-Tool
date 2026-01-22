public with sharing class ProjectHandler {
    // get total number of projects
    @AuraEnabled
    public static Integer getTotalProjects() {
        return [SELECT COUNT() FROM Project__c];
    }
    // get all projects
    @AuraEnabled
    public static List<Project__c> getAllProjects() {
        return [SELECT Id, Name, Project_Name__c, Description__c, Start_Date__c, End_Date__c, Status__c, Milestone__c FROM Project__c];
    }
    // get project details by id
    @AuraEnabled
    public static Project__c getProjectDetailsById(Id projectId) {
        return [SELECT Id, Name, Project_Name__c, Description__c, Start_Date__c, End_Date__c, Status__c, Milestone__c FROM Project__c WHERE Id = :projectId LIMIT 1];
    }
    // delete project by id
    @AuraEnabled
    public static void deleteProjectById(Id projectId) {
        Project__c projectToDelete = [SELECT Id FROM Project__c WHERE Id = :projectId LIMIT 1];
        delete projectToDelete;
    }
    
    // get complete project report data for PDF generation
    @AuraEnabled
    public static ProjectReportWrapper getProjectReportData(Id projectId) {
        ProjectReportWrapper report = new ProjectReportWrapper();
        
        report.project = [
            SELECT Id, Name, Project_Name__c, Description__c, Start_Date__c, End_Date__c, 
                   Status__c, Milestone__c, Project_Manager__c
            FROM Project__c 
            WHERE Id = :projectId 
            LIMIT 1
        ];
        
        report.tasks = [
            SELECT Id, Name, Description__c, Assigned_to__r.Name, Due_Date__c, 
                   Priority__c, Status__c
            FROM Task__c 
            WHERE Project__c = :projectId
            ORDER BY Status__c, Priority__c
        ];
        
        report.teamMembers = [
            SELECT Id, Employee__r.Name, Employee__r.Email__c, Employee__r.Role__c
            FROM Project_Member__c 
            WHERE Project__c = :projectId
        ];
        
        // calculate task statistics
        report.totalTasks = report.tasks.size();
        report.completedTasks = 0;
        report.inProgressTasks = 0;
        report.notStartedTasks = 0;
        
        for (Task__c task : report.tasks) {
            if (task.Status__c == 'Completed') {
                report.completedTasks++;
            } else if (task.Status__c == 'In Progress') {
                report.inProgressTasks++;
            } else if (task.Status__c == 'Not Started') {
                report.notStartedTasks++;
            }
        }
        
        report.totalTeamMembers = report.teamMembers.size();
        report.generatedDate = System.now();
        
        return report;
    }
    
    // wrapper class for project report data
    public class ProjectReportWrapper {
        @AuraEnabled public Project__c project { get; set; }
        @AuraEnabled public List<Task__c> tasks { get; set; }
        @AuraEnabled public List<Project_Member__c> teamMembers { get; set; }
        @AuraEnabled public Integer totalTasks { get; set; }
        @AuraEnabled public Integer completedTasks { get; set; }
        @AuraEnabled public Integer inProgressTasks { get; set; }
        @AuraEnabled public Integer notStartedTasks { get; set; }
        @AuraEnabled public Integer totalTeamMembers { get; set; }
        @AuraEnabled public Datetime generatedDate { get; set; }
    }
}
