import { LightningElement ,track} from 'lwc';
import getTotalProjects from '@salesforce/apex/ProjectDataHander.getTotalProjects';
import getAllProjects from '@salesforce/apex/ProjectDataHander.getAllProjects';
import getUserDetails from '@salesforce/apex/ProjectDataHander.getUserDetails';

export default class ProjDashboard extends LightningElement {
    @track totalProjects;
    @track completedProjects=0;
    @track myTasks=0;
    @track overdue=0;
    @track allProjects=[];
    userDetails;
    username;

    connectedCallback() {
        this.fetchTotalProjects();
        this.fetchAllProjects();
        this.fetchUserDetails();

    }
    async fetchUserDetails() {
        try {
            this.userDetails = await getUserDetails();
            console.log('User Details: ', JSON.stringify(this.userDetails));
            this.username = this.userDetails.Name;
        } catch (error) {
            console.error('Error fetching user details: ', error);
        }
    }

    fetchTotalProjects() {
        getTotalProjects()
            .then(result => {
                this.totalProjects = result;
            })
            .catch(error => {
                console.error('Error fetching total projects: ', error);
            });
        
    }
    async fetchAllProjects() {
        this.allProjects = await getAllProjects();
        console.log("Hello");
        console.log("projects",JSON.stringify(this.allProjects));
        this.completedProjects = this.allProjects.filter(project => project.Status__c === 'Completed').length;

    }
    handleRefreshProjects(){
        this.fetchAllProjects();
    }
    
}