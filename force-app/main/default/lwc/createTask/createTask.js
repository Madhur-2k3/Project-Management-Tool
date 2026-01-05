import { LightningElement ,api} from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { wire,track } from 'lwc';

export default class CreateTask extends LightningElement {
    @api recordId;
    @track showModal = false;
    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if (currentPageReference) {
            if (!this.recordId) {
                this.recordId = currentPageReference.attributes.recordId 
                    || currentPageReference.state.recordId;
            }
            console.log('Resolved Record Id -> ', this.recordId);
        }
    }

    handleCreateTask() {
        // Logic to create a task goes here
        console.log('Task creation logic triggered', this.recordId);
        this.showModal = true;
    }
    // fields=['Description','Priority'];
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
        fields.Project__c = this.recordId; // Set the WhatId to the current recordId
        this.template.querySelector('lightning-record-form').submit(fields);
    }

}