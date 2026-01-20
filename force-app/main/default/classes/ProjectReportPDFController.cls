/**
 * Controller for ProjectReportPDF Visualforce page
 * Retrieves project data and formats it for PDF rendering
 */
public with sharing class ProjectReportPDFController {
    
    // Project details
    public Project__c project { get; set; }
    
    // Related data
    public List<Task__c> tasks { get; set; }
    public List<Project_Member__c> teamMembers { get; set; }
    
    // Statistics
    public Integer totalTasks { get; set; }
    public Integer completedTasks { get; set; }
    public Integer inProgressTasks { get; set; }
    public Integer notStartedTasks { get; set; }
    public Integer totalTeamMembers { get; set; }
    
    // Report metadata
    public Datetime generatedDate { get; set; }
    public String generatedDateFormatted { get; set; }
    
    /**
     * Constructor - loads all project report data
     */
    public ProjectReportPDFController() {
        // Get project ID from URL parameter
        String projectId = ApexPages.currentPage().getParameters().get('projectId');
        
        if (String.isNotBlank(projectId)) {
            loadProjectData(projectId);
        }
    }
    
    /**
     * Load all project data for the report
     */
    private void loadProjectData(String projectId) {
        // Get project details
        List<Project__c> projects = [
            SELECT Id, Name, Project_Name__c, Description__c, Start_Date__c, 
                   End_Date__c, Status__c, Milestone__c, Project_Manager__c
            FROM Project__c 
            WHERE Id = :projectId 
            LIMIT 1
        ];
        
        if (!projects.isEmpty()) {
            project = projects[0];
        }
        
        // Get all tasks for the project
        tasks = [
            SELECT Id, Name, Description__c, Assigned_to__r.Name, Due_Date__c, 
                   Priority__c, Status__c
            FROM Task__c 
            WHERE Project__c = :projectId
            ORDER BY Status__c, Priority__c DESC
        ];
        
        // Get team members
        teamMembers = [
            SELECT Id, Employee__r.Name, Employee__r.Email__c, Employee__r.Role__c
            FROM Project_Member__c 
            WHERE Project__c = :projectId
            ORDER BY Employee__r.Name
        ];
        
        // Calculate statistics
        totalTasks = tasks.size();
        completedTasks = 0;
        inProgressTasks = 0;
        notStartedTasks = 0;
        
        for (Task__c task : tasks) {
            if (task.Status__c == 'Completed') {
                completedTasks++;
            } else if (task.Status__c == 'In Progress') {
                inProgressTasks++;
            } else if (task.Status__c == 'Not Started') {
                notStartedTasks++;
            }
        }
        
        totalTeamMembers = teamMembers.size();
        
        // Set generation date
        generatedDate = System.now();
        generatedDateFormatted = generatedDate.format('MMMM d, yyyy \'at\' h:mm a');
    }
}
