
// AutoDelete by gmail label
// script to be installed on a google account by creating and 
//   running a new project in https://script.google.com 
//
// --timball 
// Wed Jun  3 10:55:20 EDT 2020

// The name of the Gmail Label that is to be checked for purging?
var LABELS_TO_DELETE = [
  "autodelete",
];

var TRIGGER_NAME = "dailyDeleteGmail";

// Purge messages in the above label automatically after how many days?
var DELETE_AFTER_DAYS = "7";
  
// Archive messages in above label automatically after how many days?
var ARCHIVE_AFTER_DAYS = "1";

// 
var TIMEZONE = "EST";

// Maximum number of threads to process per run
var PAGE_SIZE = 150;

// If number of threads exceeds page size, resume job after X mins (max execution time is 6 mins)
var RESUME_FREQUENCY = 10;

/*

IMPLEMENTATION

*/
function Intialize() {
  return;
}

function Install() {

  // First run 2 mins after install
  ScriptApp.newTrigger(TRIGGER_NAME)
           .timeBased()
           .at(new Date((new Date()).getTime() + 1000*60*2))
           .create();
  
  // Run daily there after
  ScriptApp.newTrigger(TRIGGER_NAME)
           .timeBased().everyDays(1).create();

}

function Uninstall() {
  
  var triggers = ScriptApp.getProjectTriggers();
  for (var i=0; i<triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  
}

function dailyDeleteGmail() {

  var delete_age = new Date();
  var archive_age = new Date();
  
  delete_age.setDate(delete_age.getDate() - DELETE_AFTER_DAYS);    
  archive_age.setDate(archive_age.getDate() - ARCHIVE_AFTER_DAYS);
  
  var purge  = Utilities.formatDate(delete_age, TIMEZONE, "yyyy-MM-dd");
  var archive = Utilities.formatDate(archive_age, TIMEZONE, "yyyy-MM-dd");
  
  // --timball PAUSE here bc need to think about this search... specifically "before: purge" tereny bc we want the smaller of the two -> (purge <= archive) ? purge : archive
  var search = "(label:" + LABELS_TO_DELETE.join(" OR label:") + ") before:" + purge;
  Logger.log("PURGE: " + purge);
  Logger.log("SEARCH: " + search);
  
  try {
    
    var threads = GmailApp.search(search, 0, PAGE_SIZE);
    
    // Resume again in 10 minutes
    if (threads.length == PAGE_SIZE) {
      Logger.log("Scheduling follow up job...");
      ScriptApp.newTrigger(TRIGGER_NAME)
               .timeBased()
               .at(new Date((new Date()).getTime() + 1000*60*RESUME_FREQUENCY))
               .create();
    }
    
    // Move threads/messages which meet age criteria to trash
    Logger.log("Processing " + threads.length + " threads...");
    for (var i=0; i<threads.length; i++) {
      var thread = threads[i];
      
      if (thread.getLastMessageDate() < delete_age) {
        thread.moveToTrash();
      } else {
        var messages = GmailApp.getMessagesForThread(threads[i]);
        for (var j=0; j<messages.length; j++) {
          var email = messages[j];       
          if (email.getDate() < delete_age) {
            email.moveToTrash();
          }
        }
      }
    }
    
  } catch (e) {}
  
}
