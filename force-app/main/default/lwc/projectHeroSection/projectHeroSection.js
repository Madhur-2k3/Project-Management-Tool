import { LightningElement,api } from 'lwc';

export default class ProjectHeroSection extends LightningElement {
    @api projectdata;
    connectedCallback() {
        console.log('Project Data in Hero Section:', JSON.stringify(this.projectdata));
    }
}