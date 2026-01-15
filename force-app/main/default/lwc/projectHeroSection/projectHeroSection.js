import { LightningElement,api,track } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { NavigationMixin } from 'lightning/navigation';



export default class ProjectHeroSection extends NavigationMixin(LightningElement) {
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
    @track createTaskModal = false;
    @track showEditModal = false;
    @track selectedStatus = 'All';
    @track selectedMilestone = 'All';
    @track selectedProjectId;
    @track selectedItemValue;
    @track showProjectDetails = false;
    @track statusOptions = [
        { label: 'All', value: 'All' },
        { label: 'Planned', value: 'Planned' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Completed', value: 'Completed' }
    ];
    @track milestoneOptions = [
        { label: 'All', value: 'All' },
        { label: 'Planning', value: 'Planning' },
        { label: 'Design', value: 'Design' },
        { label: 'Development', value: 'Development' },
        { label: 'Testing', value: 'Testing' },
        { label: 'Deployment', value: 'Deployment' }
    ];
    connectedCallback() {
        console.log('Project Data in Hero Section:', JSON.stringify(this.projectdata));
        this.filteredProjects = this.projectdata;
        
    }
    handleCreateProject(){
        this.showModal = true;
    }
    closeModal() {
        this.showModal = false;
        this.showEditModal = false;
        this.createTaskModal = false;
    }
    handleSuccess() {
        this.closeModal();  
        //refresh the project list
        
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
    handleOnselect(event){
        this.selectedItemValue = event.detail.value;
        console.log('Selected Value: ', this.selectedItemValue);
        event.stopPropagation();
        if(this.selectedItemValue==='Edit') this.showEditModal = true;
        if(this.selectedItemValue==='Create Task') this.createTaskModal = true;
    }
    handleMenuClick(event){
        event.stopPropagation();
        this.selectedProjectId = event.currentTarget.dataset.id;
        console.log('Project Clicked: ', this.selectedProjectId);
        // event.stopPropagation();

    }
    handleStatusChange(event){
        this.selectedStatus = event.detail.value;
        console.log('Selected Status: ', this.selectedStatus);
        if(this.selectedStatus === 'All'){
            this.filteredProjects = this.projectdata;
        } else {
            this.filteredProjects = this.projectdata.filter(project => project.Status__c === this.selectedStatus);
        }
    }
    handleMilestoneChange(event){
        this.selectedMilestone = event.detail.value;
        console.log('Selected Milestone: ', this.selectedMilestone);
        if(this.selectedMilestone === 'All'){
            this.filteredProjects = this.projectdata;
        } else {
            this.filteredProjects = this.projectdata.filter(project => project.Milestone__c === this.selectedMilestone);
        }
    }
    handleProjectClick(event){
        this.selectedProjectId = event.currentTarget.dataset.id;
        console.log('Project Clicked: ', this.selectedProjectId);
        if(!this.selectedProjectId) return;
        else{
            // this.showProjectDetails = true;
            this[NavigationMixin.Navigate]({
            type: 'standard__navItemPage',
            attributes: {
                        apiName: 'Project_Details'
            },
            state: {
                c__projectId: this.selectedProjectId,
                // c__projectName: this.projectdata.find(project => project.Id === this.selectedProjectId).Project_Name__c
            }
            })

        }
        
    }

}