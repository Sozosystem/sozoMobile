angular.module('starter.services', [])

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