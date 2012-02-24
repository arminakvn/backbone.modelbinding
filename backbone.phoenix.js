// Backbone.Phoenix v0.6.0
//
// Copyright (C)2011 Derick Bailey, Muted Solutions, LLC
// Distributed Under MIT Liscene
//
// Documentation and Full Licence Availabe at:
// http://github.com/derickbailey/backbone.phoenix
//
// ----------------------------
// Backbone.Phoenix
// ----------------------------
;(function(root){

var phoenix = (function(Backbone, _, $) {
  var phoenix = {
    version: "0.6.0",

    bind: function(view){
      view.modelBinder = new phoenix.ModelBinder(view);
      view.modelBinder.bind();
    },

    unbind: function(view){
      if (view.modelBinder){
        view.modelBinder.unbind()
      }
    }
  };

  phoenix.ModelBinder = function(view){
    this.bindings = [];
    this.elementBindings = [];

    this.bind = function(){
      var conventionSelector = "*[" + phoenix.Configuration.dataBindAttr + "]";
      bind.call(this, conventionSelector, view, view.model);
    };

    this.unbind = function(){
      // unbind the model bindings
      _.each(this.bindings, function(binding){
        binding.model.unbind(binding.eventName, binding.callback);
      });
    };

    this.registerDataBinding = function(model, eventName, callback){
      // bind the model changes to the elements
      model.bind(eventName, callback);
      this.bindings.push({model: model, eventName: eventName, callback: callback});
    };
  };

  // ----------------------------
  // Configuration
  // ----------------------------
  phoenix.Configuration = {
    dataBindAttr: "data-bind",

    dataBindSubstConfig: {
      "default": ""
    },

    dataBindSubst: function(config){
      _.extend(this.dataBindSubstConfig, config);
    },

    getDataBindSubst: function(elementType, value){
      var returnValue = value;
      if (value === undefined){
        if (this.dataBindSubstConfig.hasOwnProperty(elementType)){
          returnValue = this.dataBindSubstConfig[elementType];
        } else {
          returnValue = this.dataBindSubstConfig["default"];
        }
      }
      return returnValue;
    }
  }

  // ----------------------------
  // Data-Binding Handlers
  // ----------------------------

  var bindingHandlers = {};

  phoenix.addBindingHandler = function(name, handler){
    bindingHandlers[name] = handler;
  };

  phoenix.getBindingHandler = function(name){
    return bindingHandlers[name] || phoenix.defaultBindingHandler;
  };

  // data-bind="someAttr foo"
  phoenix.defaultBindingHandler = function(element, val, attr){
    element.attr(attr, val);
  };

  // data-bind="html foo"
  phoenix.addBindingHandler("html", function(element, val){
    element.html(val);
  });

  // data-bind="text foo"
  phoenix.addBindingHandler("text", function(element, val){
    element.text(val);
  });

  // data-bind="enabled foo"
  phoenix.addBindingHandler("enabled", function(element, val){
    element.attr("disabled", !val);
  });

  // data-bind="displayed foo"
  phoenix.addBindingHandler("displayed", function(element, val){
    element[val? "show" : "hide"]();
  });

  // data-bind="hidden foo"
  phoenix.addBindingHandler("hidden", function(element, val){
    element[val? "hide" : "show"]();
  });

  var setOnElement = function(element, attr, val){
    var substVal = phoenix.Configuration.getDataBindSubst(attr, val);
    var handler = phoenix.getBindingHandler(attr)
    handler(element, substVal, attr);
  };

  var splitBindingAttr = function(element) {
    var dataBindConfigList = [];
    var dataBindAttributeName = phoenix.Configuration.dataBindAttr;
    var databindList = element.attr(dataBindAttributeName).split(";");

    _.each(databindList, function(attrbind){
      var databind = $.trim(attrbind).split(" ");

      // make the default special case "text" if none specified
      if( databind.length == 1 ) databind.unshift("text");

      dataBindConfigList.push({
        elementAttr: databind[0],
        modelAttr: databind[1]
      });
    });

    return dataBindConfigList;
  };

  var attributeHandlers = {};
  
  phoenix.addAttributeHandler = function(prefix, handler){
    attributeHandlers[prefix] = handler;
  };

  var getEventConfiguration = function(element, databind){
    var config = {};
    var eventName;

    var segments = databind.modelAttr.split(":");

    if (segments.length == 1) {

      eventName = "change:" + segments[0];
      config.callback = function(model, val){
        setOnElement(element, databind.elementAttr, val);
      }

    } else {

      var prefix = segments[0];
      var handler = attributeHandlers[prefix];
      var handlerSegments = segments[1].split("|");
      var handlerConfig = handlerSegments[0];
      var attr = handlerSegments[1];

      eventName = "change:" + attr;
      config.callback = function(model, value){
        var result = handler(handlerConfig, value);
        setOnElement(element, databind.elementAttr, result);
      }

    }

    config.name = eventName;
    return config;
  }

  var bind = function(selector, view, model){
    var modelBinder = this;

    view.$(selector).each(function(index){
      var element = view.$(this);
      var databindList = splitBindingAttr(element);

      _.each(databindList, function(databind){
        var eventConfig = getEventConfiguration(element, databind);
        modelBinder.registerDataBinding(model, eventConfig.name, eventConfig.callback);
        // set default on data-bind element
        setOnElement(element, databind.elementAttr, model.get(databind.modelAttr));
      });

    });
  };

  return phoenix;
});

// Backbone.Phoenix AMD wrapper with namespace fallback
if (typeof define === 'function' && define.amd) {
    // AMD support
    define([
      'backbone',    // use Backbone 0.5.3-optamd3 branch (https://github.com/jrburke/backbone/tree/optamd3)
      'underscore',  // AMD supported
      'jquery'       // AMD supported
      ], function (Backbone, _, jQuery) {
        return phoenix(Backbone, _, jQuery);
      });
} else {
    // No AMD, use Backbone namespace
    root.Backbone = Backbone || {};
    root.Backbone.Phoenix = phoenix(Backbone, _, jQuery);
}

})(this);