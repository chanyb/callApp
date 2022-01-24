<template>
    <Page>
        <ActionBar>
            <Label text="Home"/>
        </ActionBar>

        <StackLayout>
            <Label class="info" @tap="isAndroid ? fingerPrint_android() : fingerPrint_ios()">
                <FormattedString>
                    <Span class="fas" text.decode="&#xf135; "/>
                    <Span :text="message" />
                </FormattedString>
            </Label>

            <!-- Signature pad -->
            <!-- <DrawingPad id="signaturePad" height="400" />
            <Button @tap="test()" text="Button" /> -->
        </StackLayout>
    </Page>
</template>

<script>
import { Application, Color, Utils, Frame, ImageSource, knownFolders } from '@nativescript/core';

// notification
import { LocalNotifications } from '@nativescript/local-notifications';
import { SharedNotificationDelegate } from '@nativescript/shared-notification-delegate';

// firebase (push notification)
import { firebase } from '@nativescript/firebase';

// fingerprint
import { BiometricAuth, BiometricIDAvailableResult } from "@nativescript/biometrics";
import { Human } from '../common';

export default {
    computed: {
        message() {
            return "Blank {N}-Vue";
        }
    },
    methods: {
        signature_android: function() {
            const pad = Frame.topmost().getViewById('signaturePad');
            pad.getTransparentDrawing().then((res) => {
                const img = new ImageSource(res);
                img.saveToFile(knownFolders.documents().path+'/appdata/'+'test', 'png', 100);
            });
            alert("clicked");
        },
        signature_ios: function() {
            const pad = Frame.topmost().getViewById('signaturePad');
            pad.getDrawing().then((res) => {
                knownFolders.documents().getFolder('appdata');
                const img = new ImageSource(res);
                img.saveToFile(knownFolders.documents().path+'/appdata/'+'test', 'png', 100);
            });
            alert("clicked");
        },
        broadcastReceiver_example: function() {
            let broadcastReceiver = android.content.BroadcastReceiver;
            // var intent = new android.content.Intent(android.content.Intent.ACTION_VIEW)
            var intentFilter = new android.content.IntentFilter;
            intentFilter.addAction(android.content.Intent.ACTION_LOCALE_CHANGED);
            Application.android.registerBroadcastReceiver(intentFilter, function(context, intent) {
                console.log("언어 설정을 변경했습니다.");

                Application.android.unregisterBroadcastReceiver(intentFilter);
            });
        },
        sound_android: function() {
            let media = android.media;
            let RingtoneManager = media.RingtoneManager;
            let notification = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            let Ringtone = RingtoneManager.getRingtone(Application.android.context, notification);
            Ringtone.play();

            setInterval(function() {
                Ringtone.stop();
            }.bind(Ringtone),3000);
        },
        sound_ios: function() {
            AudioServicesPlaySystemSoundWithCompletion(1020,null); //sound
        },
        vibrate_android: function() {
            let vibrateService = Application.android.context.getSystemService(android.content.Context.VIBRATOR_SERVICE);
            vibrateService.vibrate(1000);
        },
        vibrate_ios: function() {
            AudioServicesPlaySystemSoundWithCompletion(1352,null); //vibe
        },
        hasPermission: function() { // in iOS notification
            if(Application.android) return ;
            const settings = UIApplication.sharedApplication.currentUserNotificationSettings;
            const types = UIUserNotificationType.Alert | UIUserNotificationType.Badge | UIUserNotificationType.Sound;
            return (settings.types & types) > 0;
        },
        getPermission: function() { // in iOS notification
            if(Application.android) return ;
            return new Promise((resolve, reject) => {
                UNUserNotificationCenter.currentNotificationCenter().requestAuthorizationWithOptionsCompletionHandler(UNAuthorizationOptions.Alert | UNAuthorizationOptions.Badge | UNAuthorizationOptions.Sound, (granted, error) => resolve(granted));
            });
        },
        hasPermission_android: function(val) {
            return androidx.core.app.ActivityCompat.checkSelfPermission(Application.android.context, val);
        },
        getPermission_android: function() {
            androidx.core.app.ActivityCompat.requestPermissions(Application.android.foregroundActivity, [android.Manifest.permission.ACCESS_COARSE_LOCATION, android.Manifest.permission.ACCESS_FINE_LOCATION, android.Manifest.permission.ACTIVITY_RECOGNITION], 0);
        },
        isUNUserNotificationCenterAvailable: function() {
            // iOS 10 이상 사용 가능 
            return !!UNUserNotificationCenter;
        },
        notification_android: function() {
            LocalNotifications.cancelAll();
            LocalNotifications.schedule([
            {
                id: 150, // generated id if not set
                title: '채혈 대기',
                body: '앞으로 나와주세요',
                badge: 1,
                // groupedMessages: ['The first', 'Second', 'Keep going', 'one more..', 'OK Stop'], //android only
                // groupSummary: 'Summary of the grouped messages above', //android only
                // ongoing: true, // makes the notification ongoing (Android only)
                forceShowWhenInForeground: true,
                priority: 0,
                thumbnail: true,
                interval: 'minute',
                channel: 'callApp', // default: 'Channel'
                sound: this.isAndroid ? 'customsound' : 'customsound.wav',
                at: new Date(new Date().getTime() + 5 * 1000), // 10 seconds from now
                actions: [
                    {
                        id: "yes",
                        type: "button",
                        title: "Yes (and launch app)",
                        launch: true
                    },
                    {
                        id: "no",
                        type: "button",
                        title: "No",
                        launch: false
                    }
                ]
            },
            ]).then(
                (scheduledIds) => {
                    console.log('Notification id(s) scheduled: ' + JSON.stringify(scheduledIds));
                },
                (error) => {
                    console.log('scheduling error: ' + error);
                }
            );
        },
        notification_ios: async function() {
            if(!this.hasPermission()) {
                await this.getPermission();
                this.hasPermission() ? '' : alert("권한 설정을 거부하셨습니다. 기능 사용을 원하실 경우, 기기의 '설정' 앱으로 이동하여 callApp의 권한을 허용 해주세요.");
            }

            var date = new NSDateComponents();
            date.second = 59;
            this.sendNotification_ios('id', date);
            
        },
        sendNotification_ios: function(id, date) {
            var content = UNMutableNotificationContent.new();
            content.title = "채혈 대기 안내";
            content.body = "채혈 1분전입니다. 준비해주세요.";
            content.sound = UNNotificationSound.defaultSound;

            var userInfoDict = NSMutableDictionary.alloc().initWithCapacity(4);
            userInfoDict.setObjectForKey('test_notification'+id, 'id');
            content.userInfo = userInfoDict;

            // var trigger = UNTimeIntervalNotificationTrigger.triggerWithTimeIntervalRepeats(5,false);
            var trigger = UNCalendarNotificationTrigger.triggerWithDateMatchingComponentsRepeats(date, true);
            var request = UNNotificationRequest.requestWithIdentifierContentTrigger("test_notification"+id, content, trigger);
            UNUserNotificationCenter.currentNotificationCenter().addNotificationRequestWithCompletionHandler(request, (error) => (error ? console.log(`Error scheduling notification: ${error.localizedDescription}`) : null));
            this.addObserver("test_notification"+id);
        },
        addObserver: function(uniqueKey) {
            SharedNotificationDelegate.addObserver({
                delegateUniqueKey: uniqueKey, // ensures uniqueness, if not set or is null/undefined, allows multiple of the same
                userNotificationCenterWillPresentNotificationWithCompletionHandler: (notificationCenter, notification, handler, stop, next) => {
                    // is this notification something I should handle?
                    if (notification.request.content.userInfo.valueForKey('id') === 1) {
                        // do stuff
                        // intercept it and show alert
                        handler(UNNotificationPresentationOptions.Alert);
                        SharedNotificationDelegate.removeObserverByUniqueKey(uniqueKey);
                        stop();
                    }
                    // not mine, next should handle
                    next();
                },
                userNotificationCenterDidReceiveNotificationResponseWithCompletionHandler: (notificationCenter, notification, handler, stop, next) => {
                    console.log('this is in the DidReceiveNotification33');
                    if (notification.notification.request.content.userInfo.valueForKey('id') === uniqueKey) {
                        // do stuff
                        // intercept it and show alert
                        handler(UNNotificationPresentationOptions.Alert);
                        LocalNotifications.cancelAll();
                        SharedNotificationDelegate.removeObserverByUniqueKey(uniqueKey);
                        LocalNotifications.cancel(uniqueKey /* the ID */).then(foundAndCanceled => {
                            if (foundAndCanceled) {
                                console.log("OK, it's gone!")
                            } else {
                                console.log('No that id was scheduled')
                            }
                        });
                        stop();
                    }
                    next();
                }
            });
        },
        initFirebase: function() {
            firebase.init({
                // Optionally pass in properties for database, authentication and cloud messaging,
                // see their respective docs.
                showNotificationsWhenInForeground: true,
                onMessageReceivedCallback: function(message) {
                    console.log("Title: " + message.title);
                    console.log("Body: " + message.body);
                    // if your server passed a custom property called 'foo', then do this:
                    console.log("Value of 'foo': " + message.data.foo);
                },
                onPushTokenReceivedCallback: function(token) {
                    console.log("Firebase push token: " + token);
                },
            }).then(
                () => {
                    console.log("firebase.init done333");
                },
                error => {
                    console.log(`firebase.init error333: ${error}`);
                }
            );
        },
        initFirebase_ios: function() {
            firebase.init({
                // Optionally pass in properties for database, authentication and cloud messaging,
                // see their respective docs.
                showNotifications: true,
                showNotificationsWhenInForeground: true,
                iOSEmulatorFlush: true,
                onMessageReceivedCallback: function(message) {
                    console.log("Title: " + message.title);
                    console.log("Body: " + message.body);
                    // if your server passed a custom property called 'foo', then do this:
                    console.log("Value of 'foo': " + message.data.foo);
                },
                onPushTokenReceivedCallback: function(token) {
                    console.log("Firebase push token: " + token);
                },
            }).then(
                () => {
                    console.log("firebase.init done");
                },
                error => {
                    console.log(`firebase.init error: ${error}`);
                }
            );
        },
        requestUserPermission: async function() {
            const authStatus = await firebase()
                .messaging()
                .requestPermission({
                ios: {
                    alert: true
                }
                })
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL

            if (enabled) {
                console.log('Authorization status:', authStatus)
            }
        },
        location_android: function() {
            let locationManager = Application.android.context.getSystemService(android.content.Context.LOCATION_SERVICE);

            /* getLastKnownLocation 사용 
            var currentLocation = locationManager.getLastKnownLocation(android.location.LocationManager.GPS_PROVIDER);
            var latitude = currentLocation.getLatitude();
            var longitude = currentLocation.getLongitude();
            alert("lat: "+latitude+"\nlng: "+longitude);
            */

            /* LocationListener 사용 */
            var gpsListener = new android.location.LocationListener({
                onLocationChanged(location) {
                    var latitude = location.getLatitude();
                    var longitude = location.getLongitude();

                    alert("lat: "+latitude+"\nlng: "+longitude);
                }
            });

            if(locationManager.isProviderEnabled(android.location.LocationManager.GPS_PROVIDER)) {
                // 위성 이용
                // locationManager.requestLocationUpdates(android.location.LocationManager.GPS_PROVIDER, 1000, 1, gpsListener);
            }

            if(locationManager.isProviderEnabled(android.location.LocationManager.NETWORK_PROVIDER)) {
                // 이동통신 기지국 또는 WiFi access point 이용
                // locationManager.requestLocationUpdates(android.location.LocationManager.NETWORK_PROVIDER, 1000, 1, gpsListener);
            }

        },
        motion_android: function() {
            let sensorManager = Application.android.context.getSystemService(android.content.Context.SENSOR_SERVICE);
            this.getPermission_android();

            var TYPE_STEP_DETECTOR = 18;
            var stepDetector = sensorManager.getDefaultSensor(TYPE_STEP_DETECTOR);
            // console.log();

            let sensorListener = new android.hardware.SensorEventListener({
                onSensorChanged(event) {
                    console.log(event);
                },

                onAccuracyChanged(sensor, accuracy) {
                    // nothing..
                },
            })


            // 센서 속도 설정
            // * 옵션
            // - SENSOR_DELAY_NORMAL: 20,000 초 딜레이
            // - SENSOR_DELAY_UI: 6,000 초 딜레이
            // - SENSOR_DELAY_GAME: 20,000 초 딜레이
            // - SENSOR_DELAY_FASTEST: 딜레이 없음
            sensorManager.registerListener(sensorListener, stepDetector, android.hardware.SensorManager.SENSOR_DELAY_FASTEST)
        },
        location_ios: function() {
            let locationManager = new CLLocationManager();
            
            // 위치 정보 권한 요청
            locationManager.requestWhenInUseAuthorization();
            locationManager.desiredAccuracy = kCLLocationAccuracyBest;
            locationManager.startMonitoringSignificantLocationChanges();

            var latitude = locationManager.location.coordinate.latitude;
            var longitude = locationManager.location.coordinate.longitude;
            alert("lat: "+latitude+"\nlng: "+longitude);
        },
        motion_ios: function() {
            let activityManager = new CMMotionActivityManager(); // 어떻게 쓰는 건지 좀 더 알아 봐야 함.. 
            let pedoMeter = new CMPedometer();

            pedoMeter.startPedometerUpdatesFromDateWithHandler(new Date(), (data, error) => {
                if(error) {
                    console.log(error);
                }else {
                    console.log(data.numberOfSteps);
                    alert(data.numberOfSteps); // 안뜬다..
                }
            });

        },
        fingerPrint_android: function(message) {
            message===null ? message='지문을 인식해주세요.' : message;
            var biometricAuth = new BiometricAuth();

            biometricAuth.available().then((avail) => {
                // console.log(avail);
            });

            biometricAuth.verifyBiometric({
                title: '본인 인증', // optional title (used only on Android)
                message: message, // optional (used on both platforms) - for FaceID on iOS see the notes about NSFaceIDUsageDescription
                fallbackMessage: '비밀번호 입력', // optional
            })
            .then((result) => {
                console.log("111111");
                if (result.code === 0) {
                    console.log('Biometric ID OK');
                }
                else if (result.code === 40) {
                    // 지문이 일치하지 않을 때, android가 자동으로 처리해 줌
                }
            }).catch((err) => {
                console.log("6666666");
                if (err.code === -3) {
                    // Negative Button Pressed (지문으로 인증하지 않을 때)
                    console.log("잡았습니다.");
                } 
                else if(err.code === 50 && err.message === "시도 횟수가 너무 많습니다. 나중에 다시 시도하세요.") {
                    // 너무 많이 틀렸을 때
                    alert("시도 횟수가 너무 많습니다. 나중에 다시 시도하세요.");
                }
            });
        },
        fingerPrint_ios: function() {
            var biometricAuth = new BiometricAuth();
            biometricAuth.available().then((avail) => {
                if (!avail) {
                    console.log("-------- NOT AVAIL ---------");
                    return;
                }

                biometricAuth.didFingerprintDatabaseChange().then((changed) => {
                    if (changed) {
                        console.log('changed');
                        // re-auth the user by asking for his credentials before allowing a fingerprint scan again
                    } else {
                        console.log('call!');
                        // call the fingerprint scanner
                    }
                });
            });
            console.log("1111111111111");
            biometricAuth.verifyBiometric({
                title: 'Enter your password',
                message: 'Scan yer finger', // optional
                pinFallback: true, // do not allow pnFallback to enable crypto operations
                keyName: 'MySecretKeyName', // The name of the key that will be created/used
                secret: 'The Secret I want encrypted'
            }).then((result) => {
                console.log("33333333333333333333233");
                console.log(result);
                if (result.code === 0) {
                    console.log("성공");
                }else {
                    console.log("CCAAAAAAATTTTTTCCCCCCHHHHH@@@@@@@@@@@@@@@@@!!!!!!!!!!!!");
                }
            })
            .catch((err) => {
                // failed 각각의 처리는 좀 필요할 수 있다.
                console.log("failed");
                this.set('status', `Biometric ID NOT OK: " + ${JSON.stringify(err)}`)
            })

        },
    },
    data() {
        return {
            isAndroid: Application.android,
        }
    },
    created() {
        Application.ios ? this.initFirebase_ios() : this.initFirebase();
        
    },
};
</script>

<style scoped lang="scss">
    @import '@nativescript/theme/scss/variables/blue';

    // Custom styles
    .fas {
        @include colorize($color: accent);
    }

    .info {
        font-size: 20;
        horizontal-align: center;
        vertical-align: center;
    }
</style>