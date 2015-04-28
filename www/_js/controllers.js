angular.module('starter.controller', ['uiGmapgoogle-maps', 'ionic'])

.controller('MapCtrl', function($scope, $ionicLoading, $state, $cordovaSms, Ocorrencia, $ionicPopup, Camera) {
    $scope.isGPSactived = false;
    $scope.GPS = false;
    $scope.sendSMS = function() {
        var options = {
            replaceLineBreaks: false, // true to replace \n by a new line, false by default
            android: {
                intent: '' // send SMS with the native android SMS messaging
            }
        };
        $cordovaSms.send($scope.number, '123456', options).then(function() {
            alert("msg enviada com sucesso")
        }, function(error) {
            alert("Deu ruim ;x");
        });
    }
    $scope.map = {
        options: {
            /*zoomControl: true,
            zoomControlOptions: {
                style: google.maps.ZoomControlStyle.LARGE,
                position: google.maps.ControlPosition.LEFT_CENTER
            },
            scaleControl: true,
            streetViewControl: true,
            streetViewControlOptions: {
                position: google.maps.ControlPosition.RIGHT_TOP
            }*/
        },
        center: {
            latitude: -8.0631490,
            longitude: -34.8713110
        },
        zoom: 11
    };

    $scope.marker = {
        id: 0,
        /*icon: '../img/map-icon-red.png',
        options: {
            animation: 1
        },*/
        coords: {
            latitude: null,
            longitude: null
        }
    }

    $scope.find = function() {
        if (!$scope.map) return;

        $ionicLoading.show({
            content: 'Buscando localização atual...',
            showBackdrop: false
        });
        var options = {
            timeout: 10000,
            enableHighAccuracy: true,
            maximumAge: 10000
        };
        navigator.geolocation.getCurrentPosition(function(pos) {
            $ionicLoading.hide();
            console.log(pos.coords)
            $scope.map.center = {latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            $scope.marker.coords = pos.coords;

            $scope.map.zoom = 15;
            Ocorrencia.setOcorrencia(pos.coords);
            
            $scope.isGPSactived = true;
            $scope.GPS = true;
        }, function(error) {
            $ionicLoading.hide();
            $scope.isGPSactived = false;
            $scope.GPS = true;
            alert('Não foi possível encontrar a localização do aparelho. Por favor verifique se o GPS do aparelho está ativado.');

        }, options);
    }
    // A confirm dialog
    $scope.solicitarSocorro = function() {
        var confirmPopup = $ionicPopup.confirm({
            title: 'Atenção',
            template: '<b>Verifique se a sua localização no mapa está correta</b><br />O proximo passo abrirá a camêra do seu celular, você está de acordo?'
        });
        confirmPopup.then(function(res) {
            if(res) {
                console.log('You are sure');
                if(Ocorrencia.getOcorrencia() == null) return;
                    Camera.getPicture().then(function(imageURI) {
                        var o = Ocorrencia.getOcorrencia();
                        o.image = imageURI;
                        $state.go('tab.foto', {}, {reload: true});
                    }, function(err) {
                        alert("Não foi possível tirar uma foto");
                    });
            } else {
                console.log('You are not sure');
            }
         });
        
        

    }
})

.controller('FotoCtrl', function($scope, $state, Ocorrencia, $http) {
    $scope.ocorrencia = Ocorrencia.getOcorrencia();
    if(typeof $scope.ocorrencia.image != 'undefined') {
        $scope.image = $scope.ocorrencia.image;
    }
    console.log($scope.ocorrencia);
    $scope.confirmarSolicitacao = function() {
        $http.post('http://10.0.0.4:3000/ocorrencias/add', {
            longitude: $scope.ocorrencia.longitude,
            latitude: $scope.ocorrencia.latitude
        }).
        success(function(data, status, headers, config) {
            alert('Ocorrencia enviada com sucesso');
            $state.go('tab.ocorrencias');
        }).
        error(function(data, status, headers, config) {
            alert('Não deu');
        });
    }
})

.controller('OcorrenciasCtrl', function($scope, $http, Ocorrencias, $ionicLoading) {
    $scope.ocorrencias = [];
    $ionicLoading.show({
            content: 'Buscando ocorrências...',
            showBackdrop: true
        });
    $http.get('http://10.0.0.4:3000/ocorrencias/list/todas').
    success(function(response, status, headers, config) {
      $scope.ocorrencias = response.data;
      for(var i in $scope.ocorrencias) {
        var o = $scope.ocorrencias[i];
        var d = new Date(o.dataCriacao);
        o.dataCriacao = d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear() + "  " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
        switch(o.situacaoOcorrencia) {
            case "PENDENTE":
                o.situacao = "em análise";
                break;
            case "EM_ANALISE":
                o.situacao = "em análise";
                break;
            case "ATENDIMENTO_ENCAMINHADO":
                o.situacao = "viatura a caminho";
                break;
            case "FINALIZADA":
                o.situacao = "finalizada";
                break;
            case "CANCELADA":
                o.situacao = "cancelada";
                break;
        }
      }
      Ocorrencias.set($scope.ocorrencias);
      $ionicLoading.hide();
    }).
    error(function(data, status, headers, config) {
      console.log("não foi possível acessar a url");
      $ionicLoading.hide();
    });

    $scope.deletarOcorrencia = function(ocorrencia) {
        $http.get('http://172.16.1.86:3000/ocorrencias/delete/' + ocorrencia.id);
    }

})

.controller('OcorrenciaCtrl', function($scope, $stateParams, Ocorrencias, $http, $ionicLoading, $timeout, $state) {
    
    $ionicLoading.show({
        content: 'Carregando ocorrência...',
        showBackdrop: true
    });
    $scope.ocorrencia = Ocorrencias.get($stateParams.id);
    if($scope.ocorrencia == null) {
        $state.go("tab.ocorrencias");
        return;
    }

    $http.get('http://maps.googleapis.com/maps/api/geocode/json?latlng=' + $scope.ocorrencia.latitude + ',' + $scope.ocorrencia.longitude + '&sensor=false').
    success(function(response, s, h, c) {
        if(typeof response.results[0] == 'undefined') {
            $scope.ocorrencia.endereco = "Não foi possível localizar o endereco dessa ocorrência.";
            return;
        }
        $scope.ocorrencia.endereco = response.results[0].formatted_address;
        $ionicLoading.hide();
    }).
    error(function(response, s, h,c ) {
        $ionicLoading.hide();
    });

    $timeout(function() {
        $ionicLoading.hide();
    }, 60000)
});
