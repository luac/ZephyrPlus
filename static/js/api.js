var messages = [
    {
	id: 0,
	parent_class: null,
	parent_instance: null,
      	message: "Hi Tim!",
	sender: 'gurtej',
	timestamp: '01-01-9999 21:59',
	recipient: null,
    },
    {
	id: 1,
	parent_class: null,
	parent_instance: null,
	message: "We should meet tomorrow",
	sender: 'mikewu',
	timestamp: '01-01-9999 21:59',
	recipient: null,
    },
    {
	id: 2,
	parent_class: null,
	parent_instance: null,
	message: "Nom nom nom babies",
	sender: 'garywang',
	timestamp: '01-01-9999 21:59',
	recipient: 'gurtej',
    },
    {
	id: 3,
	parent_class: null,
	parent_instance: null,
	message: "yay sipb",
	sender: 'timyang',
	timestamp: '02-05-9999 11:11',
	recipient: null,
    }
];

var instances = [
    {
	id: 0,
	name: "hello",
	last_messaged: '01-01-9999 21:59',
	color: "#ff9900",
	parent_class: null,
	messages: [messages[0]]
    },
    {
	id: 1,
	name: "meeting",
	last_messaged: '01-01-9999 21:59',
	color: "#cc6600",
	parent_class: null,
	messages: [messages[1]]
    },
    {
	id:2,
	name: "hooray",
	last_messaged: '02-04-9999 11:11',
	color: "#c66600",
	parent_class: null,
	messages: [messages[3]]
    }
];

var classes = [
    {
	id: 0,
	name: "zephyrplus",
	last_messaged: '01-01-9999 21:59',
	color: "#ffff00",
	instances: [instances[0], instances[1]],
	messages:[messages[0], messages[1]],
    },
    {
	id: 1,
	name: "sipb",
	last_messaged: '01-01-9999 21:59',
	color: "#0099ff",
	instances: [instances[2]],
	messages: [messages[3]],
    }
];

var personal_messages = [messages[2]];
var classes_messages = [messages[0], messages[1], messages[3]];

messages[0].parent_class = classes[0];
messages[0].parent_instance = instances[0];
messages[1].parent_class = classes[0];
messages[1].parent_instance = instances[1];
instances[0].parent_class = classes[0];
instances[1].parent_class = classes[0];

messages[3].parent_class = classes[1];
messages[3].parent_instance = instances[2];
instances[2].parent_class = classes[1];


var personals = [
    'gurtej',
    'timyang',
    'garywang',
    'mikewu',
    'zeidman',
    'mr.unknown',
    'ashketchup',
    'ruthie',
    'mprat',
    'pkoms',
    'taylors',
];

// TODO: Have functions to load all this data from the server


/*
 * ZephyrAPI -- Interface with server backend
 * 
 *      api = new ZephyrAPI()
 *              Create a new instance of the API and connect to server
 * 
 * Methods
 *      api.addSubscription(class, instance, recipient, callback)
 *      api.removeSubscription(class, instance, recipient, callback)
 *      api.sendZephyr(message, class, instance, recipient, callback)
 * 
 * Properties
 *      api.ready
 *              Boolean indicating whether or not the user's information has been retrieved from the server.
 *      api.classes
 *              Array of the classes that the user has subscribed to.  (See Google Docs for details)
 *      api.instances
 *              Array of instances that have zephyrs.  (See GDocs.)
 *      api.messages
 *              Array of all zephyrs that have been received.  (See GDocs.)
 *      api.username
 *              String containing the user's username.
 *      api.subscriptions
 *              Array of the user's subscriptions.
 * 
 * Event handlers
 *      api.onready = function()
 *              Called when the API successfully retrives the user's information
 *              from the server, indicating that the API is ready to send and receive zephyrs.
 *      api.onzephyr = function(zephyrs)
 *              Called when zephyrs are received from the server.  zephyrs is an array of zephyrs.
 *      api.onerror = function(jqXHR, errorType)
 *              Called when an error occured while sending or retrieving information
 *              from the server.
 */
(function(){
    function ZephyrAPI(){
        var api = this;
        api.ready = false;
        api.classes = [];
        api.classDict = {};
        api.instances = [];
        api.messages = [];
        
        function subscribe(sub){
            findClass(sub.class);
            sub.last_messaged = new Date(0);
            getMessages(sub, true);
        }
        
        function getMessages(sub, repeat){
            $.get("/chat", {
                class: sub.class,
                instance: sub.instance,
                recipient: sub.recipient,
                startdate: sub.last_messaged-0,
                longpoll: true
            }, function(messages){
                for(var n=0; n<messages.length; n++){
                    messages[n] = {
                        parent_class: findClass(messages[n].class),
                        parent_instance: findInstance(messages[n].instance, messages[n].class),
                        sender: messages[n].sender,
                        timestamp: new Date(messages[n].date),
                        message_body: messages[n].message
                    }
                    if(messages[n].parent_class.last_messaged < messages[n].timestamp)
                        messages[n].parent_class.last_messaged = messages[n].timestamp;
                    if(messages[n].parent_instance.last_messaged < messages[n].timestamp)
                        messages[n].parent_instance.last_messaged = messages[n].timestamp;
                    if(sub.last_messaged < messages[n].timestamp)
                        sub.last_messaged = messages[n].timestamp;
                    messages[n].parent_class.messages.push(messages[n]);
                    messages[n].parent_instance.messages.push(messages[n]);
                    api.messages.push(messages[n]);
                }
                if(api.onzephyr)
                    api.onzephyr(messages);
                if(repeat)
                    getMessages(sub);
            }, "json").error(api.onerror);
        }
        
        function findClass(name){
            if(api.classDict[name] == undefined){
                api.classDict[name] = {
                    name: name,
                    last_messaged: new Date(0),
                    color: hashStringToColor(name),
                    instances: [],
                    instanceDict: {},
                    messages: []
                }
                api.classes.push(api.classDict[name]);
            }
            return api.classDict[name];
        }
        
        function findInstance(name, className){
            var parent = findClass(className);
            if(parent.instanceDict[name] == undefined){
                parent.instanceDict[name] = {
                    name: name,
                    last_messaged: new Date(0),
                    color: hashStringToColor(name),
                    parent_class: parent,
                    messages: []
                }
                parent.instances.push(parent.instanceDict[name]);
                api.instances.push(parent.instanceDict[name]);
            }
            return parent.instanceDict[name];
        }
        
        $.get("/user", function(data){
            api.username = data.username;
            api.subscriptions = data.subscriptions;
            for(var n=0; n<api.subscriptions.length; n++){
                subscribe(api.subscriptions[n]);
            }
            api.ready = true;
            if(api.onready)
                api.onready();
        }, "json").error(api.onerror);
        
        function checkReady(){
            if(!api.ready)
                throw new Error("ZephyrAPI not ready yet");
        }
        
        api.addSubscription = function(className, instanceName, recipientName){
            checkReady();
            if(!instanceName)
                instanceName = "*";
            if(!recipientName)
                recipientName = "*";
            throw new Error("Not yet implemented");
        }
        
        api.removeSubscription = function(className, instanceName, recipientName){
            checkReady();
            throw new Error("Not yet implemented");
        }
        
        api.sendZephyr = function(message, className, instanceName, recipientName, callback){
            checkReady();
            return $.post("/chat", {
                class: className,
                instance: instanceName,
                recipient: recipientName,
                message: message
            }, callback, "json").error(api.onerror);
        }
        
    }
    window.ZephyrAPI = ZephyrAPI;
})();
