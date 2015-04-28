angular.module('starter.services', [])

.factory('$localstorage', ['$window', function($window) {
  return {
    set: function(key, value) {
      $window.localStorage[key] = value;
    },
    get: function(key, defaultValue) {
      return $window.localStorage[key] || defaultValue;
    },
    setObject: function(key, value) {
      $window.localStorage[key] = JSON.stringify(value);
    },
    getObject: function(key) {
      return JSON.parse($window.localStorage[key] || '{}');
    },
    removeItem: function(key) {
      $window.localStorage.removeItem(key);
      console.log("oi")
    }
  }
}])

.factory('Sozo', function($http) {
  var novoUsuario = false;
  return {
    getNovoUsuario: function() {
      return novoUsuario;
    },
    setNovoUsuario: function(b) {
      novoUsuario = b;
    }
  }
})

.factory('Camera', ['$q', function($q) {

  return {
    getPicture: function(options) {
      var q = $q.defer();

      navigator.camera.getPicture(function(result) {
        // Do any magic you need
        q.resolve(result);
      }, function(err) {
        q.reject(err);
      }, options);

      return q.promise;
    }
  }
}])

.factory('Ocorrencias', function($http) {
  var ocorrencias = null;
  return {
    set: function(os) {
      ocorrencias = os;
    },
    all: function() {
      return ocorrencias;
    },
    get: function(id) {
      for(var i in ocorrencias) {
        var o = ocorrencias[i];
        if(o.id == id) return o;
      }
      return null;
    }
  }
})

.service('Ocorrencia', function() {
  var ocorrencia = null;
  return {
    setOcorrencia: function(o) {
      ocorrencia = o;
    },
    getOcorrencia: function() {
      return ocorrencia;
    }
  }
});