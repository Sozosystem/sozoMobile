angular.module('starter.controller', ['uiGmapgoogle-maps', 'ionic'])

.controller('CadastroCtrl', function($scope, $state, $localstorage, $http, Sozo, $ionicPopup) {
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
                    $http.post('http://10.1.2.38:3000/solicitantes/add', $scope.solicitante).
                    success(function(response, status, headers, config) {
                        var id = response.data;
                        $scope.solicitante.id = id;
                        $localstorage.setObject("solicitante", $scope.solicitante);
                        alert('Cadastro efetuado com sucesso');
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

.controller('MapCtrl', function($scope, $ionicLoading, $state, $cordovaSms, Ocorrencia, $ionicPopup, Camera, $localstorage, Sozo, $window) {
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
                        $state.go('foto', {}, {reload: true});
                    }, function(err) {
                        alert("Não foi possível tirar uma foto");
                    });
            } else {
                console.log('You are not sure');
            }
         });
    }
})

.controller('FotoCtrl', function($scope, $state, Ocorrencia, $http, $localstorage) {
    $scope.ocorrencia = Ocorrencia.getOcorrencia();
    if(typeof $scope.ocorrencia.image != 'undefined') {
        $scope.image = $scope.ocorrencia.image;
    }
    console.log($scope.ocorrencia);
    $scope.confirmarSolicitacao = function() {
        $http.post('http://10.1.2.38:3000/ocorrencias/add', {
            longitude: $scope.ocorrencia.longitude,
            latitude: $scope.ocorrencia.latitude,
            foto: getBase64Image(document.getElementById("foto")),
            solicitanteId: $localstorage.getObject("solicitante").id
        }).
        success(function(data, status, headers, config) {
            alert('Ocorrencia enviada com sucesso');
            $state.go('tab.ocorrencias');
        }).
        error(function(data, status, headers, config) {
            alert('Não deu');
        });
    }
    console.log(getBase64Image(document.getElementById("foto")));
    function getBase64Image(img) {
        var canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        var dataURL = canvas.toDataURL("image/png");

        return dataURL;//.replace(/^data:image\/(png|jpg);base64,/, "");
    }
})

.controller('OcorrenciasCtrl', function($scope, $http, Ocorrencias, $ionicLoading, $localstorage) {
    $scope.ocorrencias = [];
    $ionicLoading.show({
            content: 'Buscando ocorrências...',
            showBackdrop: true
        });
    console.log($localstorage.getObject("solicitante").id);
    $http.get('http://10.1.2.38:3000/ocorrencias/solicitante/' + $localstorage.getObject("solicitante").id).
    //$http.get('http://192.168.2.2:3000/ocorrencias/list/todas').
    success(function(response, status, headers, config) {
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

.controller('OcorrenciaCtrl', function($scope, $stateParams, Ocorrencias, $http, $ionicLoading, $timeout, $state, $ionicPopup) {
    
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

    $scope.cancelarSolicitacao = function(ocorrencia) {
        var confirmPopup = $ionicPopup.confirm({
            title: 'Atenção',
            template: '<b>Você tem certeza que deseja cancelar essa solicitação?</b>'
        });
        confirmPopup.then(function(res) {
            if(res) {
                    $http.get('http://10.1.2.38:3000/ocorrencias/delete/' + ocorrencia.id).
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
