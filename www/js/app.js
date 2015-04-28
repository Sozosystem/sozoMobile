// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'starter.controller', 'starter.services', 'ngCordova'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
  //$ionicConfigProvider.tabs.position('bottom');
  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // setup an abstract state for the tabs directive
    .state('tab', {
    url: "/tab",
    abstract: true,
    templateUrl: "templates/tabs.html"
  })

  .state('cadastro', {
    url: "/cadastro",
    templateUrl: 'templates/cadastro.html',
    controller: 'CadastroCtrl'
  })

  .state('foto', {
    url: '/foto',
    cache: false,
    templateUrl: 'templates/tab-foto.html',
    controller: 'FotoCtrl' 
  })
  // Each tab has its own nav history stack:

  .state('tab.map', {
    url: '/map',
    views: {
      'tab-map': {
        templateUrl: 'templates/tab-map.html',
        controller: 'MapCtrl'
      }
    }
  })

  

  .state('tab.ocorrencias', {
    url: '/ocorrencias',
    cache: false,
    views: {
      'tab-ocorrencias': {
        templateUrl: 'templates/tab-ocorrencias.html',
        controller: 'OcorrenciasCtrl'
      }
    }
  })

  .state('tab.ocorrencia', {
    url: '/ocorrencias/:id',
    views: {
      'tab-ocorrencias': {
        templateUrl: 'templates/ocorrencia.html',
        controller: 'OcorrenciaCtrl'
      }
    }
  })

  .state('tab.ajustes', {
    url: '/ajustes',
    views: {
      'tab-ajustes': {
        templateUrl: 'templates/tab-ajustes.html',
        controller: 'AjustesCtrl'
      }
    }
  })

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/cadastro');

})

.filter('trusted', ['$sce', function ($sce) {
    return function(url) {
        return $sce.trustAsResourceUrl(url);
    };
}]);
