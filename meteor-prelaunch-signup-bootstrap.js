Emails = new Meteor.Collection("emails")

EMAIL_REGEX = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

var ADMIN_USERS = ['github-username'];

function isAdmin(userId) {
  var user = Meteor.users.findOne({_id: userId});
  try {
    return ADMIN_USERS.indexOf(user.services.github.username) !== -1
  } catch(e) {
    return false;
 }
}

if(Handlebars){
  Handlebars.registerHelper('isActiveNow', function (routes, className){
    var currentRoute = Router.current();
      if (!currentRoute) return '';

    currentRoute = Router.current().route.name.toLowerCase();
    var reg = new RegExp(routes, 'i');

    if (className.hash)className = 'active';

    return reg.test(currentRoute) ? className : '';
  });

    Handlebars.registerHelper("prettifyDate", function (timestamp) {
    var monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    var result = [
      timestamp.getDate(),
      monthNames[timestamp.getMonth()],
      timestamp.getFullYear()
    ];

    return result.join(" ");
  });
}

if (Meteor.isClient) {
  Meteor.subscribe('userData');
  Meteor.subscribe('emails');

  Router.configure({
      layoutTemplate: 'layout',
      yieldTemplates: {
        'header': {to: 'header'},
        'footer': {to: 'footer'}
      }
  });

  Router.map( function () {
    this.route('main', {
        path: '/',
        template: 'main'
    });
    this.route('about');
    this.route('contact');
  });

  Template.main.showAdmin = function () {
    return Session.get("showAdmin");
  };

  Template.signup.events({
    'submit form': function (e, t) {

      var email = t.find('input').value
      , doc = {email: email, referrer: document.referrer, timestamp: new Date()};

      if (EMAIL_REGEX.test(email)){
        Session.set("showBadEmail", false);
        Meteor.call("insertEmail", doc);
        Session.set("emailSubmitted", true);
      } else {
        Session.set("showBadEmail", true);
      }
      return false;
    }
  });

  Template.signup.showBadEmail = function () {
    return Session.get("showBadEmail");
  };

  Template.signup.emailSubmitted = function () {
    return Session.get("emailSubmitted");
  };

  Template.footer.events({
    'click .login': function (e, t){
      Meteor.loginWithGithub();
      return false;
    },

    'click .admin': function (e, t){
      Session.set("showAdmin", !Session.get("showAdmin"));
    }
   });

  Template.footer.isAdmin = function () {
    return isAdmin(Meteor.userId());
  };

  Template.admin.emails = function () {
    return Emails.find().fetch();
  };
}

if (Meteor.isServer) {
  Meteor.publish("userData", function () {
    return Meteor.users.find({_id: this.userId},
      {fields: {'services.github.username': 1, 'username':1}});
  });

  Meteor.publish("emails", function () {
    if (isAdmin(this.userId)) {
      return Emails.find();
    }
  });

  Meteor.methods({
      insertEmail: function (doc) {
          Emails.insert(doc);
      }
  });
}