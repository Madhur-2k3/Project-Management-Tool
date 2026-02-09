/**
 * @description       : One trigger per object - Account trigger delegating to handler
 * @events            : after update
 * @notes             : Updates related Contacts&#39; Description when Account.Industry changes
 */
trigger AccountTrigger on Account (after update) {
    if (Trigger.isAfter && Trigger.isUpdate) {
        AccountTriggerHandler.afterUpdate(Trigger.new, Trigger.oldMap);
    }
}
