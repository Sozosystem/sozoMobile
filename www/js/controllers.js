var API = "http://192.168.2.2/SozoAPI/public/";
angular.module('starter.controller', ['uiGmapgoogle-maps', 'ionic'])

.controller('CadastroCtrl', function($scope, $state, $localstorage, $http, Sozo, $ionicPopup, $cordovaToast) {
    localStorage.clear();
    if($localstorage.get('firstTime', null) != null) {
        $state.go('tab.map');
    }
    if($localstorage.get('armazenarDados', null) == null) {
        $localstorage.set('armazenarDados', true);
    }
    $scope.solicitante = {
        nome: null,
        telefone: null
    }
    $scope.error = {
        messages: [],
        nome: false,
        telefone: false
    };
    
    $scope.cadastrar = function() {
        
        $scope.error = {
            messages: [],
            nome: false,
            telefone: false
        };
        if($scope.solicitante.nome == null) {
            $scope.error.messages.push('Preencha o campo Nome Completo');
            $scope.error.nome = true;
        }else if(!new RegExp("^[a-zà-ú]+[ ][a-z à-ú]{1,70}[a-zà-ú]$", "i").test($scope.solicitante.nome)) {
            
            $scope.error.messages.push('Preencha o campo Nome Completo com um nome válido');
            $scope.error.nome = true;
        }
        if($scope.solicitante.telefone == null) {
            console.log($scope.telefone)
            $scope.error.messages.push('Preencha o campo Telefone');
            $scope.error.telefone = true;
        }else if(!new RegExp("^[0-9]{2}[ ][0-9]{8}$").test($scope.solicitante.telefone)) {
            $scope.error.messages.push('Preencha o campo Telefone corretamente no formato DD + Número ex: 88 88888888');
            $scope.error.telefone = true;
        }
        if($scope.error.messages.length > 0) return;

        var confirmPopup = $ionicPopup.confirm({
            title: 'Atenção',
            template: '<b>Verifique se ' + $scope.solicitante.telefone + ' é o número do seu aparelho atual</b><br />Será enviado uma mensagem para o aparalho com um código de confirmação, você deseja prosseguir?'
        });
        confirmPopup.then(function(res) {
            if(res) {
                    $http.post(API + 'solicitantes/add', $scope.solicitante).
                    success(function(response, status, headers, config) {
                        var id = response.data.id;
                        $scope.solicitante.id = id;
                        $localstorage.setObject("solicitante", $scope.solicitante);
                        //alert('Cadastro efetuado com sucesso');
                        $cordovaToast.showLongBottom('Cadastro efetuado com sucesso');
                        Sozo.setNovoUsuario(true);
                        $state.go('tab.map', {}, {reload: true});
                    }).
                    error(function(data, status, headers, config) {
                        alert('Não foi possível realizar o cadastro');
                    });
            } else {
                console.log('Cadastro cancelado');
            }
         });
        
    }
})

.controller('MapCtrl', function($scope, $ionicLoading, $state, $cordovaSms, Ocorrencia, $ionicPopup, Camera, $localstorage, Sozo, $window, $ionicModal, $cordovaCapture, $cordovaToast, $cordovaFileTransfer, $http) {
    /*console.log(Sozo.getNovoUsuario());
    if(!Sozo.getNovoUsuario()) {
        localStorage.clear();
    }
    var times = $localstorage.get('firstTime', null);
    if(times == null) {
        console.log("primeira vez");
        $localstorage.set('firstTime', 1);
        $state.go('cadastro');
        return;
    }*/
    $scope.isGPSactived = false;
    $scope.GPS = false;
    $scope.map = {
        options: {
            disableDefaultUI: true
        /*
            zoomControl: true,
            zoomControlOptions: {
                //style: google.maps.ZoomControlStyle.LARGE,
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
     $ionicModal.fromTemplateUrl('modal.html', function($ionicModal) {
        $scope.modal = $ionicModal;
    }, {
        // Use our scope for the scope of the modal to keep it simple
        scope: $scope,
        // The animation we want to use for the modal entrance
        animation: 'slide-in-up'
    });
    $scope.solicitarSocorro = function() {
        Camera.getPicture().then(function(imageURI) {
            var o = Ocorrencia.getOcorrencia();
            o.image = imageURI;
                        $scope.modal.hide();
                        //$state.go('foto', {}, {reload: true});
                        var confirmPopup = $ionicPopup.confirm({
                            title: 'Atenção',
                            template: '<b>Você tem certeza que deseja enviar essa solicitação?</b>'
                        });
                        confirmPopup.then(function(res) {
                            if(res) {
                                    send();
                            }
                         });
                    }, function(err) {
                        console.log(err);
                    }, {encodingType: 1});
    }

    $scope.solicitarSocorroVideo = function() {
        var options = { limit: 1, duration: 15 };

        $cordovaCapture.captureVideo(options).then(function(videoData) {
            var o = Ocorrencia.getOcorrencia();
            o.image = videoData[0].localURL;
            $scope.modal.hide();
            var confirmPopup = $ionicPopup.confirm({
                            title: 'Atenção',
                            template: '<b>Você tem certeza que deseja enviar essa solicitação?</b>'
                        });
                        confirmPopup.then(function(res) {
                            if(res) {
                                    send();
                            }
                         });
        }, function(err) {
            console.log(err)
            alert(err)
        });
    }

   

    $scope.openModal = function() {
        console.log('Opening Modal');
        $scope.modal.show();
      };

    function send() {
        $scope.ocorrencia = Ocorrencia.getOcorrencia();
    if(typeof $scope.ocorrencia.image != 'undefined') {
        var format = $scope.ocorrencia.image.split(".")[$scope.ocorrencia.image.split(".").length-1];
    }
        $ionicLoading.show({
          template: 'Registrando ocorrência <br/><br/><ion-spinner></ion-spinner>',
          showBackdrop: true
        });
        $cordovaFileTransfer.upload(API + '/ocorrencias/upload', $scope.ocorrencia.image, {
            params: {
                "solicitante_id": $localstorage.getObject("solicitante").id,
                "formato": format
            }
        }).then(function(result) {
                var r = JSON.parse(result.response);
                if(r.type) {
                    $http.post(API + 'ocorrencias/add', {
                        longitude: $scope.ocorrencia.longitude,
                        latitude: $scope.ocorrencia.latitude,
                        solicitante_id: $localstorage.getObject("solicitante").id,
                        file: r.data
                    }).
                    success(function(data, status, headers, config) {
                        $ionicLoading.hide();
                        $cordovaToast.showLongBottom('Solicitação enviada com sucesso');
                        $state.go('tab.ocorrencias');
                    }).
                    error(function(data, status, headers, config) {
                        $ionicLoading.hide();
                        $cordovaToast.showLongBottom('Não foi possível efetuar a solicitação');
                    });
                }else {
                    $ionicLoading.hide();
                    $cordovaToast.showLongBottom('Não foi possível efetuar a solicitação');
                }
                
            }, function(err) {
                $ionicLoading.hide();
                $cordovaToast.showLongBottom('Não foi possível efetuar a solicitação');
            }, function (progress) {
            });
    }
})

.controller('FotoCtrl', function($scope, $state, Ocorrencia, $http, $localstorage, $cordovaFileTransfer, $ionicLoading, $cordovaToast, $sce) {
    $scope.ocorrencia = Ocorrencia.getOcorrencia();
    if(typeof $scope.ocorrencia.image != 'undefined') {
        var format = $scope.ocorrencia.image.split(".")[$scope.ocorrencia.image.split(".").length-1];
        $scope.image = $sce.trustAsResourceUrl($scope.ocorrencia.image);
    }

    $scope.confirmarSolicitacao = function() {
        $ionicLoading.show({
          template: 'Registrando ocorrência <br/><br/><ion-spinner></ion-spinner>',
          showBackdrop: true
        });
        $cordovaFileTransfer.upload(API + '/ocorrencias/upload', $scope.ocorrencia.image, {
            params: {
                "solicitante_id": $localstorage.getObject("solicitante").id,
                "formato": format
            }
        }).then(function(result) {
                var r = JSON.parse(result.response);
                if(r.type) {
                    $http.post(API + 'ocorrencias/add', {
                        longitude: $scope.ocorrencia.longitude,
                        latitude: $scope.ocorrencia.latitude,
                        solicitante_id: $localstorage.getObject("solicitante").id,
                        file: r.data
                    }).
                    success(function(data, status, headers, config) {
                        $ionicLoading.hide();
                        $cordovaToast.showLongBottom('Solicitação enviada com sucesso');
                        $state.go('tab.ocorrencias');
                    }).
                    error(function(data, status, headers, config) {
                        $ionicLoading.hide();
                        $cordovaToast.showLongBottom('Não foi possível efetuar a solicitação');
                    });
                }else {
                    $ionicLoading.hide();
                    $cordovaToast.showLongBottom('Não foi possível efetuar a solicitação');
                }
                
            }, function(err) {
                $ionicLoading.hide();
                $cordovaToast.showLongBottom('Não foi possível efetuar a solicitação');
            }, function (progress) {
            });
    }
})

.controller('OcorrenciasCtrl', function($scope, $http, Ocorrencias, $ionicLoading, $localstorage) {
    $scope.ocorrencias = [];
    $ionicLoading.show({
            content: 'Buscando ocorrências...',
            showBackdrop: true
        });
    $http.get(API + 'ocorrencias/solicitante/' + $localstorage.getObject("solicitante").id).
    success(function(response, status, headers, config) {
        console.log(response);
        if(response.data instanceof Array)  $scope.ocorrencias = response.data;
      console.log($scope.ocorrencias)
      for(var i in $scope.ocorrencias) {
        var o = $scope.ocorrencias[i];
        var d = new Date(o.dataCriacao);
        o.dataCriacao = d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();// + "  " + d.getHours(); + ":" + d.getMinutes() + ":" + d.getSeconds();
        console.log(o.dataCriacao)
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
})

.controller('OcorrenciaCtrl', function($scope, $stateParams, Ocorrencias, $http, $ionicLoading, $timeout, $state, $ionicPopup, $sce) {
    
    $ionicLoading.show({
        content: 'Carregando ocorrência...',
        showBackdrop: true
    });
    $scope.ocorrencia = Ocorrencias.get($stateParams.id);
    $scope.isFoto = true;
    if($scope.ocorrencia.foto.indexOf(".mp4") != -1) $scope.isFoto = false;
    if($scope.ocorrencia == null) {
        $state.go("tab.ocorrencias");
        return;
    }
    $scope.ocorrencia.foto = $sce.trustAsResourceUrl(API + "uploads/" + $scope.ocorrencia.foto);


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

    $scope.cancelarSolicitacao = function(ocorrencia) {
        var confirmPopup = $ionicPopup.confirm({
            title: 'Atenção',
            template: '<b>Você tem certeza que deseja cancelar essa solicitação?</b>'
        });
        confirmPopup.then(function(res) {
            if(res) {
                    $http.get(API + 'ocorrencias/delete/' + ocorrencia.id).
                    success(function(response, status, headers, config) {
                        if(response.type == true) {
                            alert('solicitação cancelada com sucesso');
                        }else {
                            alert('Não foi possível cancelar a solicitação');
                        }
                        
                        $state.go('tab.ocorrencias', {}, {reload: true});
                    }).
                    error(function(data, status, headers, config) {
                        alert('Não foi possível cancelar a solicitação');
                    });
            }
         });
        
    }
})

.controller('AjustesCtrl', function($scope, $http, $state, $ionicPopup, $localstorage) {
    $scope.solicitante = $localstorage.getObject("solicitante");
    var nome = $scope.solicitante.nome;
    $scope.armazenarDados = $localstorage.get("armazenarDados");
    console.log($scope.armazenarDados)
    $scope.error = {
        messages: [],
        nome: false
    }

    $scope.salvarNome = function() {
        $scope.error = {
            messages: [],
            nome: false
        }
        if(!new RegExp("^[a-zà-ú]+[ ][a-z à-ú]{1,70}[a-zà-ú]$", "i").test($scope.solicitante.nome)) {
            $scope.error.messages.push('Preencha o campo Nome Completo com um nome válido');
            $scope.error.nome = true;
        }

        if($scope.error.nome) {
            $scope.solicitante.nome = nome;
            return;
        }
        $localstorage.setObject("solicitante", $scope.solicitante);

    }
    $scope.toggleArmazenarDados = function() {
        if($scope.armazenarDados) {
            $scope.armazenarDados = false;
        }else {
            $scope.armazenarDados = true;
        }

        $localstorage.set("armazenarDados", $scope.armazenarDados);
        console.log("oi")
    }
});
