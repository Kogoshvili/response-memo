let color = '#3aa757';

chrome.runtime.onInstalled.addListener(() => {
  console.log('Default background color set to %cgreen', `color: ${color}`);
});



// chrome.debugger.attach({ tabId: tab.id }, '1.1', async (response) => {
//   console.log('Attached to debugger', response);
// });

