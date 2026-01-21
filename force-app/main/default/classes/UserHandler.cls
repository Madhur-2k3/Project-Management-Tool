public with sharing class UserHandler {
    
    @AuraEnabled
    public static User getUserDetails() {
        return [SELECT Id, Name, Username, Profile.Name, UserRole.Name FROM User WHERE Id = :UserInfo.getUserId()];
    }
}
