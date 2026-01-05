import { LightningElement,api,track } from 'lwc';
import { refreshApex } from '@salesforce/apex';



export default class ProjectHeroSection extends LightningElement {
    // @api projectdata;
    @api 
    set projectdata(value){
    this._projectdata = value;

    if(value){
        this.filteredProjects = [...value]; // clone
    }   
    }
    get projectdata(){
    return this._projectdata;
    }

    @track showModal = false;
    @track searchKey = '';
    @track filteredProjects=[];
    connectedCallback() {
        console.log('Project Data in Hero Section:', JSON.stringify(this.projectdata));
        this.filteredProjects = this.projectdata;
        
    }
    handleCreateProject(){
        this.showModal = true;
    }
    closeModal() {
        this.showModal = false;
    }
    handleSuccess() {
        this.closeModal();  
    }
    handleCancel() {
        this.closeModal();
    }
    handleSubmit(event) {
        event.preventDefault(); // Prevent default submit
        const fields = event.detail.fields;
        this.template.querySelector('lightning-record-form').submit(fields);

    }
    handleSearchChange(event){
        const searchKey = event.target.value.toLowerCase();
        this.filteredProjects = this.projectdata.filter(project => 
            project.Project_Name__c.toLowerCase().includes(searchKey) || 
            (project.Description__c && project.Description__c.toLowerCase().includes(searchKey))
        );
    }

}