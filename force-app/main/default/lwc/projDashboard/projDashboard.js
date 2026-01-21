import { LightningElement, track } from 'lwc';
import getTotalProjects from '@salesforce/apex/ProjectHandler.getTotalProjects';
import getAllProjects from '@salesforce/apex/ProjectHandler.getAllProjects';
import getUserDetails from '@salesforce/apex/UserHandler.getUserDetails';

export default class ProjDashboard extends LightningElement {
    @track totalProjects;
    @track completedProjects=0;
    @track myTasks=0;
    @track overdue=0;
    @track allProjects=[];
    userDetails;
    username;

    //Fetch data on component load
    connectedCallback() {
        this.fetchTotalProjects();
        this.fetchAllProjects();
        this.fetchUserDetails();

    }
    // Fetch user details from Apex
    async fetchUserDetails() {
        try {
            this.userDetails = await getUserDetails();
            console.log('User Details: ', JSON.stringify(this.userDetails));
            this.username = this.userDetails.Name;
        } catch (error) {
            console.error('Error fetching user details: ', error);
        }
    }

    // Fetch total projects count from Apex
    fetchTotalProjects() {
        getTotalProjects()
            .then(result => {
                this.totalProjects = result;
            })
            .catch(error => {
                console.error('Error fetching total projects: ', error);
            });
        
    }
    // Fetch all projects from Apex
    async fetchAllProjects() {
        this.allProjects = await getAllProjects();
        console.log("Hello");
        console.log("projects",JSON.stringify(this.allProjects));
        this.completedProjects = this.allProjects.filter(project => project.Status__c === 'Completed').length;

    }
    // Refresh projects data
    handleRefreshProjects(){
        this.fetchAllProjects();
    }
    
}