import { LightningElement, track } from 'lwc';
import getTotalProjects from '@salesforce/apex/ProjectHandler.getTotalProjects';
import getAllProjects from '@salesforce/apex/ProjectHandler.getAllProjects';

export default class ProjectDashboard extends LightningElement {
    @track totalProjects;
    @track completedProjects=0;
    @track myTasks=0;
    @track overdue=0;

    connectedCallback() {
        this.fetchTotalProjects();

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
        console.log("projects",JSON.stringify(this.allProjects));
        // this.completedProjects = this.allProjects.filter(project => project.Status__c === 'Completed').length;

    }
}