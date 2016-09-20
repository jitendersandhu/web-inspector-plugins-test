angular.module('cwPluginApp', []).config(['$compileProvider', '$locationProvider', function($compileProvider, $locationProvider) {
    // enable it to find the bootstrapped element
    $compileProvider.debugInfoEnabled(true);
    // $locationProvider.html5Mode({
    //     enabled: true,
    //     requireBase: false,
    //     rewriteLinks: true
    // });
}]).run(function() {

});

angular.module('cwPluginApp').controller('cwPluginAppController', ['$scope', '$location', function($scope, $location) {
    console.log($location);
    $scope.availablePlugins = ['event-inspector'];
    $scope.init = function(plugins) {
        $scope.plugins = plugins;
    };
}]);

angular.module('cwPluginApp').directive('cwPluginInjector', ['$compile', function($compile) {
    return {
        scope: {
            plugin: '='
        },
        link: function(scope, element) {
            var generatedTemplate = '<div ' + 'cw-' + scope.plugin.name +
                ' config = "plugin.config"> </div>';
            element.append($compile(generatedTemplate)(scope));
        }
    };
}]);

window._cwPluginApp = (function() {
    var injectCwTemplate = function(pluginInpput) {
        var d = document.createElement('div');
        d.id = 'cw-plugin-app-template';

        d.innerHTML = '<div id="cw-angular-plugin-app" ng-controller=\'cwPluginAppController\' ng-init=\'init(' + JSON.stringify(pluginInpput) + ')\'><div ng-repeat=\'plugin in plugins\'><div ng-if=\'availablePlugins.indexOf(plugin.name) > -1\'><div cw-plugin-injector plugin=\'plugin\'></div></div></div></div>'; // jscs:ignore maximumLineLength
        // HACK: bootstrap angular app before injecting to dom to void `btstrpd` error
        angular.bootstrap(d, ['cwPluginApp']);
        document.body.appendChild(d);
    };
    return {
        init: function(pluginInpput) {
            var cwTemplate = document.querySelector('#cw-plugin-app-template');

            if (!cwTemplate) {
                injectCwTemplate(pluginInpput);
            } else {
                console.log('Plugin already loaded');
            }
        }
    };
}());

'use strict';
/**
 * @ngdoc directive
 * @name clockworkApp.directive:columboWebInspectorDirective
 * @description
 *
 * Controller of the clockworkApp
 */
angular.module('cwPluginApp')
    .directive('cwEventInspector', ['$window', '$timeout', 'eventInspectorFactory', function($window, $timeout, eventInspectorFactory) {
        return {
            restrict: 'EA',
            scope: {
                config: '='
            },
            templateUrl: 'event-inspector/event-inspector-template.html',
            link: function(scope) {

                var panelBody,
                    returnToTop,
                    /**
                     * scrollToTopPanelBody
                     *
                     * no @return
                     */
                    scrollToTopPanelBody = function() {
                        var scrollTimeout = 0,
                            currentTop = panelBody.scrollTop;

                        while (currentTop > 0) {
                            scrollTimeout++;
                            currentTop = currentTop - 32;
                            animateScroll(currentTop, scrollTimeout);
                        }
                    },
                    /**
                     * animateScroll
                     *
                     * @param  {Number} currentTop
                     * @param  {Number} scrollTimeout
                     * no @return
                     */
                    animateScroll = function(currentTop, scrollTimeout) {
                        (function() {
                            setTimeout(function() {
                                panelBody.scrollTop = currentTop;
                            }, 10 * scrollTimeout);
                        })();
                    },
                    /**
                     * hideSpinner.
                     *
                     * no @return
                     */
                    hideSpinner = function() {
                        $timeout(function() {
                            scrollToTopPanelBody();
                            scope.columboStatsProperties.showInspectorSpinner = false;
                        }, 2000);
                    };

                scope.columboStatsProperties = eventInspectorFactory.getColumboStatsProperties();

                $window._cwInspectorPublishLogsCallBack = function(controlTypes, instrumentType, instrumentValue,
                    level, timeStamp, apiURL, apiStatus, totalQueuedEvents, totalEventsSent) {
                    // Only show spinner if inspector window is not collapsed
                    if (!scope.columboStatsProperties.isWindowCollapsed) {
                        scope.columboStatsProperties.showInspectorSpinner = true;
                    }
                    $timeout(function() {
                        eventInspectorFactory.updateColumboWebStats(controlTypes, instrumentType, instrumentValue,
                            level, timeStamp, apiURL, apiStatus, totalQueuedEvents, totalEventsSent);

                        scope.checkNoRecords();
                        hideSpinner();
                    });
                };

                //To show no records list item when no items to display
                scope.checkNoRecords = function() {
                    $timeout(function() {
                        var listitems = panelBody.querySelectorAll('.stats-list .list-item.inspector-stats'),
                            hiddenElements = 0,
                            item;

                        for (item = 0; item < listitems.length; item++) {
                            if (listitems[item].classList.contains('ng-hide')) {
                                hiddenElements++;
                            }
                        }
                        scope.columboStatsProperties.filter.noRecords = listitems.length === hiddenElements;
                    });
                };

                //Update the filter type and check no records
                scope.onClickFilter = function(type) {
                    eventInspectorFactory.updateFilterType(type);
                    scope.checkNoRecords();
                };

                //On click of site visit filter item, get the site visit data
                scope.onGetSiteVisitData = function() {
                    eventInspectorFactory.getSiteVisitData();
                };

                //On click of page view filter item, get the page view data
                scope.onGetPageViewData = function() {
                    eventInspectorFactory.getPageViewData();
                };

                //On click of input text, clear the filter and show all types of events
                scope.onClearFilter = function() {
                    eventInspectorFactory.updateFilterType('ALL');
                    scope.checkNoRecords();
                };

                //Click on the switch icon, animate the view and get tracker properties
                scope.switchInspectorView = function() {
                    var isFilterFixed = scope.columboStatsProperties.isFilterFixed;
                    scope.columboStatsProperties.inspectorSlideLeft = !scope.columboStatsProperties.inspectorSlideLeft;
                    scope.columboTrackerProperties = eventInspectorFactory.getTrackerProperties();
                    scope.columboStatsProperties.isFilterFixed = false;
                    $timeout(function() {
                        scrollToTopPanelBody();
                        scope.columboStatsProperties.isFilterFixed = !isFilterFixed;
                    }, 400);
                };

                //To Show/Hide the scroll to top icon
                $timeout(function() {
                    panelBody = document.getElementsByClassName('inspector-panel-body')[0];
                    returnToTop = document.getElementById('return-to-top');

                    //On scroll of the panel body, check the scroll top and display the up arrow button
                    angular.element(panelBody).bind('scroll', function() {
                        if (panelBody.scrollTop >= 100) {
                            returnToTop.style.display = 'block';
                        } else {
                            returnToTop.style.display = 'none';
                        }
                    });

                    //Scroll to top of the panel when arrow is clicked.
                    angular.element(returnToTop).bind('click', function() {
                        scrollToTopPanelBody();
                    });
                });
            }
        };
    }]);

'use strict';
/**
 * @ngdoc factory
 * @name clockworkApp.factory:eventInspectorFactory
 * @description
 *
 * Constructor Factory of the clockworkApp
 */
angular.module('cwPluginApp')
    .factory('eventInspectorFactory', function() {
        var eventInspectorFactory = {},
            trackerProperties = {},
            columboStatsProperties = {
                isWindowCollapsed: false,
                statsLeft: false,
                columboStats: [],
                totalQueuedEvents: 0,
                totalEventsSent: 0,
                eventsCount: 0,
                logsCount: 0,
                ajaxCount: 0,
                siteVisitCount: 0,
                pageViewCount: 0,
                showInspectorSpinner: false,
                showSiteVisit: false,
                showPageView: false,
                showEventsList: true,
                isFilterFixed: true,
                pageViewData: [],
                filter: {
                    search: '',
                    type: 'ALL',
                    noRecords: 0
                },
                controlTypes: {},
                itemColors: {
                    warn: 'WARN',
                    info: 'INFO',
                    success: 'SUCCESS',
                    error: 'ERROR',
                    'default': 'PAYLOAD'
                }
            },
            /**
             * getEventsInformation
             *
             * @param  {String} instrumentType
             * no @return
             */
            getEventsInformation = function(instrumentType) {

                //Increment the count based on the instrument type
                if (instrumentType === 'LOG') {
                    columboStatsProperties.logsCount++;
                } else if (instrumentType === 'EVENT') {
                    columboStatsProperties.eventsCount++;
                } else if (instrumentType === 'AJAX') {
                    columboStatsProperties.ajaxCount++;
                } else if (instrumentType === 'SITE VISIT') {
                    columboStatsProperties.siteVisitCount++;
                } else if (instrumentType === 'PAGE VIEW') {
                    columboStatsProperties.pageViewCount++;
                }

                //Calculating the percentage of each type
                columboStatsProperties.logsPercent = Math.round(columboStatsProperties.logsCount /
                    columboStatsProperties.columboStats.length * 100, -1);

                columboStatsProperties.eventsPercent = Math.round(columboStatsProperties.eventsCount /
                    columboStatsProperties.columboStats.length * 100, -1);

                columboStatsProperties.ajaxPercent = Math.round(columboStatsProperties.ajaxCount /
                    columboStatsProperties.columboStats.length * 100, -1);

                columboStatsProperties.siteVisitPercent = Math.round(columboStatsProperties.siteVisitCount /
                    columboStatsProperties.columboStats.length * 100, -1);

                columboStatsProperties.pageViewPercent = Math.round(columboStatsProperties.pageViewCount /
                    columboStatsProperties.columboStats.length * 100, -1);

            };

        /**
         * Variables used to control Columbo Stats
         *
         * @return {Object}
         */
        eventInspectorFactory.getColumboStatsProperties = function() {
            return columboStatsProperties;
        };

        /**
         * getTrackerProperties
         *
         * @return {Object} tracker properties
         */
        eventInspectorFactory.getTrackerProperties = function() {
            var properties = {};
            if (Columbo && Columbo.tracker) {
                properties.pageId = Columbo.tracker.getPageId();
                properties.sessionId = Columbo.tracker.getSessionId();
                properties.fingerPrint = Columbo.tracker.getUserFingerprint();
                properties.isDevEnv = Columbo.tracker.isDevEnvironment();
                properties.isTrackerInitialized = Columbo.tracker.isTrackerInitialized();
                properties.isTrackerAuthorized = Columbo.tracker.isTrackerAuthorized();
                properties.initConfig = Columbo.tracker.getColumboInitConfig();
            }
            trackerProperties = properties;
            return trackerProperties;
        };

        /**
         * getSiteVisitData Gets the site visit payload and update the views that needs to be shown
         *
         * no @return
         */
        eventInspectorFactory.getSiteVisitData = function() {
            columboStatsProperties.siteVisitPayload = Columbo.tracker.getCurrentSiteVisit();

            columboStatsProperties.showSiteVisit = true;
            columboStatsProperties.showPageView = false;
            columboStatsProperties.showEventsList = false;
        };

        /**
         * getPageViewData Gets the page view payload and update the views that needs to be shown
         *
         * no @return
         */
        eventInspectorFactory.getPageViewData = function(updatePageViewOnly) {
            var currentPageView = Columbo.tracker.getCurrentPageView(),
                pageExists = false,
                pageIndex;

            // Only if currentPageView is defined,
            // Loop through the pageviews list and check if page is already added/present, else add to list
            if (currentPageView) {
                for (pageIndex = 0; pageIndex < columboStatsProperties.pageViewData.length; pageIndex++) {
                    if (columboStatsProperties.pageViewData[pageIndex].pageViewId === currentPageView.pageViewId) {
                        pageExists = true;
                    }
                }

                if (!pageExists) {
                    columboStatsProperties.pageViewData.unshift(currentPageView);
                }
            }

            if (!updatePageViewOnly) {
                columboStatsProperties.showPageView = true;
                columboStatsProperties.showSiteVisit = false;
                columboStatsProperties.showEventsList = false;
            }
        };

        /**
         * updateFilterType Update the filter type on click of the filter item and update the views.
         *
         * @param  {String} type Instrument type
         * no @return
         */
        eventInspectorFactory.updateFilterType = function(type) {
            columboStatsProperties.filter.type = type;

            columboStatsProperties.showEventsList = true;
            columboStatsProperties.showSiteVisit = false;
            columboStatsProperties.showPageView = false;
        };

        /**
         * updateColumboWebStats
         *
         * @param  {Object} controlTypes
         * @param  {String} instrumentType
         * @param  {String} instrumentValue
         * @param  {String} level
         * @param  {String} timeStamp
         * @param  {String} apiURL
         * @param  {Number} apiStatus
         * @param  {Number} totalQueuedEvents
         * @param  {Number} totalEventsSent
         * no @return
         */
        eventInspectorFactory.updateColumboWebStats = function(controlTypes, instrumentType, instrumentValue,
            level, timeStamp, apiURL, apiStatus, totalQueuedEvents, totalEventsSent) {
            var controlType,
                itemColor = 'default',
                controlTypeKey,
                tempLevel;

            if (controlTypes) {
                columboStatsProperties.controlTypes = controlTypes;
            } else {
                //If total events present add up the events sent
                if (totalEventsSent) {
                    columboStatsProperties.totalEventsSent = columboStatsProperties.totalEventsSent + totalEventsSent;
                }

                columboStatsProperties.totalQueuedEvents = totalQueuedEvents;

                //if the instrument type is payload, update the timestamp and control type
                if (instrumentType === 'EVENT' && instrumentValue.controlType) {
                    for (controlTypeKey in columboStatsProperties.controlTypes) {
                        if (columboStatsProperties.controlTypes.hasOwnProperty(controlTypeKey) &&
                            instrumentValue.controlType === columboStatsProperties.controlTypes[controlTypeKey]) {
                            controlType = controlTypeKey;
                            break;
                        }
                    }

                    if (!controlType) {
                        controlType = 'CUSTOM';
                    }
                }

                //Based on the level of the log, update the color for item
                tempLevel = level ? level.toLowerCase() : ''; // change to lower case
                // If level exists in itemColors object, assign value to itemColor
                if (columboStatsProperties.itemColors[tempLevel]) {
                    itemColor = tempLevel;
                }

                //Based on the status code, update the color for item
                if (instrumentType === 'AJAX') {
                    if (apiStatus >= 200 && apiStatus < 300) {
                        itemColor = 'success';
                    } else {
                        itemColor = 'error';
                    }
                }

                //If the instrument type is page view call the page view tracker method.
                if (instrumentType === 'PAGE VIEW') {
                    eventInspectorFactory.getPageViewData(true);
                }

                //Push the new item at the begining of the Array
                columboStatsProperties.columboStats.unshift({
                    controlType: controlType,
                    instrumentType: instrumentType,
                    apiStatus: apiStatus,
                    apiURL: apiURL,
                    level: level,
                    instrumentValue: instrumentValue,
                    itemColor: itemColor,
                    timeStamp: timeStamp
                });

                getEventsInformation(instrumentType, instrumentValue);
            }
        };

        return eventInspectorFactory;

    });

angular.module('cwPluginApp').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('event-inspector/event-inspector-template.html',
    '<div class="columbo-stats-container" ng-class="{\'stats-left\': columboStatsProperties.statsLeft, \'stats-right\': !columboStatsProperties.statsLeft}"> <div class="inspector-spinner-backdrop" ng-show="columboStatsProperties.showInspectorSpinner && !columboStatsProperties.inspectorSlideLeft"> <span class="inspector-spinner" ng-include="\'icons/spinner.svg\'"></span> </div> <div class="inspector-panel inspector-panel-default"> <div id="return-to-top" class="panel-icons arrow-up-circle" ng-show="!columboStatsProperties.isWindowCollapsed" ng-include="\'icons/arrows-left-circled.svg\'"></div> <!-- Inspector Heading Start --> <div class="inspector-panel-heading"> <span>Columbo Web</span> <div class="pull-right window-icons"> <span class="panel-icons minus" ng-if="!columboStatsProperties.isWindowCollapsed" ng-include="\'icons/circle-minus.svg\'" ng-click="columboStatsProperties.isWindowCollapsed = !columboStatsProperties.isWindowCollapsed"></span> <span class="panel-icons plus" ng-if="columboStatsProperties.isWindowCollapsed" ng-include="\'icons/circle-plus.svg\'" ng-click="columboStatsProperties.isWindowCollapsed = !columboStatsProperties.isWindowCollapsed"></span> <span class="panel-icons" ng-include="\'icons/arrows-left-circled.svg\'" ng-click="columboStatsProperties.statsLeft = !columboStatsProperties.statsLeft" ng-class="{\'arrow-left-circle\':!columboStatsProperties.statsLeft, \'arrow-right-circle\': columboStatsProperties.statsLeft}"></span> <span class="panel-icons" ng-include="\'icons/switch.svg\'" ng-click="switchInspectorView()"></span> </div> </div> <!-- Inspector Heading End --> <div class="inspector-panel-body" ng-class="{\'inpsector-panel-height\' : columboStatsProperties.isWindowCollapsed}"> <!-- Inspector Filters Start --> <div class="filter-section" ng-class="{\'filter-hide\': columboStatsProperties.isWindowCollapsed || columboStatsProperties.inspectorSlideLeft}"> <div class="event-stats clearfix"> <span>Events Queued : {{columboStatsProperties.totalQueuedEvents}}</span> <span>Events Sent : {{columboStatsProperties.totalEventsSent}}</span> <input class="pull-right" type="search" name="columboSearch" placeholder="Search" ng-model="columboStatsProperties.filter.search" ng-click="onClearFilter()" ng-model-options="{ debounce: 1000 }"> </div> <div class="filters clearfix"> <div> <span class="filter-item info" ng-click="onClickFilter(\'LOG\')"> <span>LOG</span> <span class="inspector-badge" ng-bind="columboStatsProperties.logsCount"></span> </span> <span class="filter-item success" ng-click="onClickFilter(\'AJAX\')"> <span>AJAX</span> <span class="inspector-badge" ng-bind="columboStatsProperties.ajaxCount"></span> </span> <span class="filter-item cornflower-blue" ng-click="onClickFilter(\'EVENT\')"> <span>EVENT</span> <span class="inspector-badge" ng-bind="columboStatsProperties.eventsCount"></span> </span> <span class="filter-item primary" ng-click="onGetSiteVisitData()"> <span>SITE VISIT</span> </span> <span class="filter-item light-coral" ng-click="onGetPageViewData()"> <span>PAGE VIEW</span> <span class="inspector-badge" ng-if="columboStatsProperties.pageViewData.length>1" ng-bind="columboStatsProperties.pageViewData.length"></span> </span> </div> </div> </div> <!-- Inspector Filters End --> <div class="events-inspector inspector-step" ng-class="{\'inspector-slide-left\': columboStatsProperties.inspectorSlideLeft, \'slide-hide\': columboStatsProperties.inspectorSlideLeft}"> <!-- Columbo Events/Logs Template Start--> <ul class="stats-list" ng-if="columboStatsProperties.showEventsList"> <li class="list-item inspector-stats" data-count="{{filteredStats.length}}" ng-show="stats.instrumentType === columboStatsProperties.filter.type || columboStatsProperties.filter.type===\'ALL\'" ng-class="stats.itemColor" ng-repeat="stats in filteredStats = (columboStatsProperties.columboStats | filter:columboStatsProperties.filter.search)  "> <div class="item-content"> <p> <span class="item-label" ng-bind="stats.instrumentType"></span> <span class="instrument-level item-value" ng-if="stats.level">{{stats.level}}</span> </p> <p ng-if="stats.controlType"> <span class="item-label">Control Type : </span> <span class="item-value" ng-bind="stats.controlType"></span> </p> <p ng-if="stats.apiStatus !== undefined"> <span class="item-label">API Status : </span> <span class="item-value status-code" ng-bind="stats.apiStatus"></span> </p> <p> <span class="item-label">Message : </span> <span class="item-value" ng-if="stats.instrumentType === \'AJAX\' || stats.instrumentType === \'LOG\' " ng-bind="stats.instrumentValue"></span> <span ng-if="stats.apiURL">( URL : {{stats.apiURL}})</span> <div class="item-value" ng-if="stats.instrumentType !== \'AJAX\' && stats.instrumentType !== \'LOG\' "> <pre>\n' +
    '                                        <code class="json" ng-bind="stats.instrumentValue | json">\n' +
    '                                        </code>\n' +
    '                                    </pre> </div> <p></p> <span class="timestamp" ng-bind="stats.timeStamp"></span> </div> </li> <li class="list-item info" ng-if="!columboStatsProperties.columboStats.length"> <div class="list-content"> <span>No Stats Found, Please contact <a href="mailto:appeng-ui-team@group.apple.com?Subject=ColumboWeb" target="_top">AppEng UI</a> for support. </span> </div> </li> <li class="list-item info" ng-if="(columboStatsProperties.filter.search && !filteredStats.length && columboStatsProperties.columboStats.length) || (columboStatsProperties.columboStats.length && columboStatsProperties.filter.noRecords)"> <div class="list-content"> <span>No matching records were found.</span> </div> </li> </ul> <!-- Site Visit Tracker --> <div class="stats-list" ng-if="columboStatsProperties.showSiteVisit"> <div class="list-item default" ng-if="columboStatsProperties.siteVisitPayload"> <div class="list-content"> <p>SITE VISIT</p> <pre>\n' +
    '                                <code class="json" ng-bind="columboStatsProperties.siteVisitPayload | json">\n' +
    '                                </code>\n' +
    '                            </pre> </div> </div> <div class="list-item info" ng-if="!columboStatsProperties.siteVisitPayload"> <div class="list-content"> <span>No events fired for SITE VISIT.</span> </div> </div> </div> <!-- Page View Tracker --> <div ng-if="columboStatsProperties.showPageView"> <ul class="stats-list"> <li class="list-item default" ng-repeat="pageView in columboStatsProperties.pageViewData"> <div class="list-content"> <p>PAGE VIEW</p> <pre>\n' +
    '                                <code class="json" ng-bind="pageView | json">\n' +
    '                                </code>\n' +
    '                            </pre> </div> </li> <li class="list-item info" ng-if="!columboStatsProperties.pageViewData.length"> <div class="list-content"> <span>No events fired for PAGE VIEW.</span> </div> </li> </ul> </div> <!-- Columbo Events/Logs Template End--> </div> <div class="events-dashboard inspector-step" ng-if="columboStatsProperties.inspectorSlideLeft"> <div class="events-dashboard-content"> <!-- Columbo Init Config Panel--> <div class="inspector-panel"> <div class="inspector-panel-heading"> <span> Columbo Init Configuration</span> </div> <div class="events-dashboard-body"> <p> <pre>\n' +
    '                                    <code ng-bind="columboTrackerProperties.initConfig | json"></code>\n' +
    '                                </pre> </p> </div> </div> <!-- Columbo Tracker Information Panel --> <div class="inspector-panel"> <div class="inspector-panel-heading"> <span> Tracker Information</span> </div> <div class="events-dashboard-body"> <div class="txt-item"> <p class="txt-label">Page ID</p> <p class="txt-value" ng-bind="columboTrackerProperties.pageId"></p> </div> <div class="txt-item"> <p class="txt-label">Session ID</p> <p class="txt-value" ng-bind="columboTrackerProperties.sessionId"></p> </div> <div class="txt-item"> <p class="txt-label">Finger Print</p> <p class="txt-value" ng-bind="columboTrackerProperties.fingerPrint"></p> </div> <div class="txt-item"> <p class="txt-label">Is Dev Env</p> <p class="txt-value" ng-bind="columboTrackerProperties.isDevEnv"></p> </div> <div class="txt-item"> <p class="txt-label">Tracker Authorized</p> <p class="txt-value" ng-bind="columboTrackerProperties.isTrackerAuthorized"></p> </div> <div class="txt-item"> <p class="txt-label">Tracker Initialized</p> <p class="txt-value" ng-bind="columboTrackerProperties.isTrackerInitialized"></p> </div> </div> </div> </div> </div> </div> </div> </div> '
  );


  $templateCache.put('icons/arrows-left-circled.svg',
    '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="438.533px" height="438.533px" viewBox="0 0 438.533 438.533" style="enable-background:new 0 0 438.533 438.533" xml:space="preserve"> <g> <path d="M409.133,109.203c-19.608-33.592-46.205-60.189-79.798-79.796C295.736,9.801,259.058,0,219.273,0\n' +
    '		c-39.781,0-76.47,9.801-110.063,29.407c-33.595,19.604-60.192,46.201-79.8,79.796C9.801,142.8,0,179.489,0,219.267\n' +
    '		c0,39.78,9.804,76.463,29.407,110.062c19.607,33.592,46.204,60.189,79.799,79.798c33.597,19.605,70.283,29.407,110.063,29.407\n' +
    '		s76.47-9.802,110.065-29.407c33.593-19.602,60.189-46.206,79.795-79.798c19.603-33.596,29.403-70.284,29.403-110.062\n' +
    '		C438.533,179.485,428.732,142.795,409.133,109.203z M288.646,306.913c3.621,3.614,5.435,7.901,5.435,12.847\n' +
    '		c0,4.948-1.813,9.236-5.435,12.847l-29.126,29.13c-3.61,3.617-7.891,5.428-12.84,5.421c-4.951,0-9.232-1.811-12.854-5.421\n' +
    '		L104.21,232.111c-3.617-3.62-5.424-7.898-5.424-12.848c0-4.949,1.807-9.233,5.424-12.847L233.826,76.795\n' +
    '		c3.621-3.615,7.902-5.424,12.854-5.424c4.949,0,9.229,1.809,12.84,5.424l29.126,29.13c3.621,3.615,5.435,7.898,5.435,12.847\n' +
    '		c0,4.946-1.813,9.233-5.435,12.845l-87.646,87.65L288.646,306.913z"/> </g> </svg> '
  );


  $templateCache.put('icons/arrows-left.svg',
    '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="100%" height="100%" viewBox="0 0 284.929 284.929" style="enable-background:new 0 0 284.929 284.929" xml:space="preserve"> <g> <g> <path d="M165.304,142.468L277.517,30.267c1.902-1.903,2.847-4.093,2.847-6.567c0-2.475-0.951-4.665-2.847-6.567L263.239,2.857\n' +
    '			C261.337,0.955,259.146,0,256.676,0c-2.478,0-4.665,0.955-6.571,2.857L117.057,135.9c-1.903,1.903-2.853,4.093-2.853,6.567\n' +
    '			c0,2.475,0.95,4.664,2.853,6.567l133.048,133.043c1.903,1.906,4.086,2.851,6.564,2.851c2.478,0,4.66-0.947,6.563-2.851\n' +
    '			l14.277-14.267c1.902-1.903,2.851-4.094,2.851-6.57c0-2.472-0.948-4.661-2.851-6.564L165.304,142.468z"/> <path d="M55.668,142.468L167.87,30.267c1.903-1.903,2.851-4.093,2.851-6.567c0-2.475-0.947-4.665-2.851-6.567L153.6,2.857\n' +
    '			C151.697,0.955,149.507,0,147.036,0c-2.478,0-4.668,0.955-6.57,2.857L7.417,135.9c-1.903,1.903-2.853,4.093-2.853,6.567\n' +
    '			c0,2.475,0.95,4.664,2.853,6.567l133.048,133.043c1.902,1.906,4.09,2.851,6.57,2.851c2.471,0,4.661-0.947,6.563-2.851\n' +
    '			l14.271-14.267c1.903-1.903,2.851-4.094,2.851-6.57c0-2.472-0.947-4.661-2.851-6.564L55.668,142.468z"/> </g> </g> </svg> '
  );


  $templateCache.put('icons/arrows-right.svg',
    '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="284.936px" height="284.936px" viewBox="0 0 284.936 284.936" style="enable-background:new 0 0 284.936 284.936" xml:space="preserve"> <g> <g> <path d="M277.515,135.9L144.464,2.857C142.565,0.955,140.375,0,137.9,0c-2.472,0-4.659,0.955-6.562,2.857l-14.277,14.275\n' +
    '			c-1.903,1.903-2.853,4.089-2.853,6.567c0,2.478,0.95,4.664,2.853,6.567l112.207,112.204L117.062,254.677\n' +
    '			c-1.903,1.903-2.853,4.093-2.853,6.564c0,2.477,0.95,4.667,2.853,6.57l14.277,14.271c1.902,1.905,4.089,2.854,6.562,2.854\n' +
    '			c2.478,0,4.665-0.951,6.563-2.854l133.051-133.044c1.902-1.902,2.851-4.093,2.851-6.567S279.417,137.807,277.515,135.9z"/> <path d="M170.732,142.471c0-2.474-0.947-4.665-2.857-6.571L34.833,2.857C32.931,0.955,30.741,0,28.267,0s-4.665,0.955-6.567,2.857\n' +
    '			L7.426,17.133C5.52,19.036,4.57,21.222,4.57,23.7c0,2.478,0.95,4.664,2.856,6.567L119.63,142.471L7.426,254.677\n' +
    '			c-1.906,1.903-2.856,4.093-2.856,6.564c0,2.477,0.95,4.667,2.856,6.57l14.273,14.271c1.903,1.905,4.093,2.854,6.567,2.854\n' +
    '			s4.664-0.951,6.567-2.854l133.042-133.044C169.785,147.136,170.732,144.945,170.732,142.471z"/> </g> </g> </svg> '
  );


  $templateCache.put('icons/circle-minus.svg',
    '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="100%" height="100%" viewBox="0 0 438.533 438.533" style="enable-background:new 0 0 438.533 438.533" xml:space="preserve"> <g> <path d="M409.133,109.203c-19.608-33.592-46.205-60.189-79.798-79.796C295.736,9.801,259.058,0,219.273,0\n' +
    '		c-39.781,0-76.47,9.801-110.063,29.407c-33.595,19.604-60.192,46.201-79.8,79.796C9.801,142.8,0,179.489,0,219.267\n' +
    '		c0,39.78,9.804,76.463,29.407,110.062c19.607,33.592,46.204,60.189,79.799,79.798c33.597,19.605,70.283,29.407,110.063,29.407\n' +
    '		s76.47-9.802,110.065-29.407c33.593-19.602,60.189-46.206,79.795-79.798c19.603-33.596,29.403-70.284,29.403-110.062\n' +
    '		C438.533,179.485,428.732,142.795,409.133,109.203z M347.179,237.539c0,4.948-1.811,9.236-5.428,12.847\n' +
    '		c-3.614,3.614-7.898,5.428-12.847,5.428h-219.27c-4.948,0-9.229-1.813-12.847-5.428c-3.616-3.61-5.424-7.898-5.424-12.847v-36.547\n' +
    '		c0-4.948,1.809-9.231,5.424-12.847c3.617-3.617,7.898-5.426,12.847-5.426h219.27c4.948,0,9.232,1.809,12.847,5.426\n' +
    '		c3.617,3.615,5.428,7.898,5.428,12.847V237.539z"/> </g> </svg> '
  );


  $templateCache.put('icons/circle-plus.svg',
    '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="438.533px" height="438.533px" viewBox="0 0 438.533 438.533" style="enable-background:new 0 0 438.533 438.533" xml:space="preserve"> <g> <path d="M409.133,109.203c-19.608-33.592-46.205-60.189-79.798-79.796C295.736,9.801,259.058,0,219.273,0\n' +
    '		c-39.781,0-76.47,9.801-110.063,29.407c-33.595,19.604-60.192,46.201-79.8,79.796C9.801,142.8,0,179.489,0,219.267\n' +
    '		c0,39.78,9.804,76.463,29.407,110.062c19.607,33.592,46.204,60.189,79.799,79.798c33.597,19.605,70.283,29.407,110.063,29.407\n' +
    '		s76.47-9.802,110.065-29.407c33.593-19.602,60.189-46.206,79.795-79.798c19.603-33.596,29.403-70.284,29.403-110.062\n' +
    '		C438.533,179.485,428.732,142.795,409.133,109.203z M347.179,237.539c0,4.948-1.811,9.236-5.428,12.847\n' +
    '		c-3.62,3.614-7.901,5.428-12.847,5.428h-73.091v73.084c0,4.948-1.813,9.232-5.428,12.854c-3.613,3.613-7.897,5.421-12.847,5.421\n' +
    '		h-36.543c-4.948,0-9.231-1.808-12.847-5.421c-3.617-3.621-5.426-7.905-5.426-12.854v-73.084h-73.089\n' +
    '		c-4.948,0-9.229-1.813-12.847-5.428c-3.616-3.61-5.424-7.898-5.424-12.847v-36.547c0-4.948,1.809-9.231,5.424-12.847\n' +
    '		c3.617-3.617,7.898-5.426,12.847-5.426h73.092v-73.089c0-4.949,1.809-9.229,5.426-12.847c3.616-3.616,7.898-5.424,12.847-5.424\n' +
    '		h36.547c4.948,0,9.233,1.809,12.847,5.424c3.614,3.617,5.428,7.898,5.428,12.847v73.089h73.084c4.948,0,9.232,1.809,12.847,5.426\n' +
    '		c3.617,3.615,5.428,7.898,5.428,12.847V237.539z"/> </g> </svg> '
  );


  $templateCache.put('icons/spinner.svg',
    '<?xml version="1.0" encoding="UTF-8" standalone="no"?> <svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="35" height="35" viewBox="-18 -18 36 36"> <defs> <circle id="ref" cx="10" cy="10" r="4"/> </defs> <g id="a"> <use xlink:href="#ref" style="fill:#adadad;fill-opacity:0.5;stroke-width:0"/> <use xlink:href="#ref" transform="rotate(45)" style="fill:#adadad;fill-opacity:0.5"/> <use xlink:href="#ref" transform="rotate(90)" style="fill:#c1c1c1;fill-opacity:0.56862745"/> <use xlink:href="#ref" transform="rotate(135)" style="fill:#d7d7d7;fill-opacity:0.67843161"/> <use xlink:href="#ref" transform="rotate(180)" style="fill:#e9e9e9;fill-opacity:0.78431373"/> <use xlink:href="#ref" transform="rotate(225)" style="fill:#f4f4f4;fill-opacity:0.89019608"/> <use xlink:href="#ref" transform="rotate(270)" style="fill:#ffffff;fill-opacity:1"/> <use xlink:href="#ref" transform="rotate(315)" style="fill:#adadad;fill-opacity:0.5"/> </g> </svg>'
  );


  $templateCache.put('icons/switch.svg',
    '<?xml version="1.0" encoding="iso-8859-1"?> <!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  --> <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"> <svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="511.626px" height="511.627px" viewBox="0 0 511.626 511.627" style="enable-background:new 0 0 511.626 511.627" xml:space="preserve"> <g> <g> <path d="M301.492,347.177h-91.361c-7.614,0-14.084,2.662-19.414,7.994c-5.33,5.331-7.992,11.8-7.992,19.41v54.823\n' +
    '			c0,7.611,2.662,14.089,7.992,19.417c5.327,5.328,11.8,7.987,19.414,7.987h91.361c7.618,0,14.086-2.662,19.418-7.987\n' +
    '			c5.325-5.331,7.994-11.806,7.994-19.417v-54.823c0-7.61-2.662-14.085-7.994-19.41S309.11,347.177,301.492,347.177z"/> <path d="M118.771,347.177H27.406c-7.611,0-14.084,2.662-19.414,7.994C2.663,360.502,0,366.974,0,374.585v54.826\n' +
    '			c0,7.61,2.663,14.086,7.992,19.41c5.33,5.332,11.803,7.991,19.414,7.991h91.365c7.611,0,14.084-2.663,19.414-7.991\n' +
    '			c5.33-5.324,7.992-11.8,7.992-19.41v-54.826c0-7.611-2.662-14.083-7.992-19.411S126.382,347.177,118.771,347.177z"/> <path d="M118.771,54.814H27.406c-7.611,0-14.084,2.663-19.414,7.993C2.663,68.137,0,74.61,0,82.221v54.821\n' +
    '			c0,7.616,2.663,14.091,7.992,19.417c5.33,5.327,11.803,7.994,19.414,7.994h91.365c7.611,0,14.084-2.667,19.414-7.994\n' +
    '			s7.992-11.798,7.992-19.414V82.225c0-7.611-2.662-14.084-7.992-19.417C132.855,57.48,126.382,54.814,118.771,54.814z"/> <path d="M301.492,200.999h-91.361c-7.614,0-14.084,2.664-19.414,7.994s-7.992,11.798-7.992,19.414v54.823\n' +
    '			c0,7.61,2.662,14.078,7.992,19.406c5.327,5.329,11.8,7.994,19.414,7.994h91.361c7.618,0,14.086-2.665,19.418-7.994\n' +
    '			c5.325-5.328,7.994-11.796,7.994-19.406v-54.823c0-7.616-2.662-14.087-7.994-19.414S309.11,200.999,301.492,200.999z"/> <path d="M118.771,200.999H27.406c-7.611,0-14.084,2.664-19.414,7.994C2.663,214.32,0,220.791,0,228.407v54.823\n' +
    '			c0,7.61,2.663,14.078,7.992,19.406c5.33,5.329,11.803,7.994,19.414,7.994h91.365c7.611,0,14.084-2.665,19.414-7.994\n' +
    '			c5.33-5.328,7.992-11.796,7.992-19.406v-54.823c0-7.616-2.662-14.087-7.992-19.414S126.382,200.999,118.771,200.999z"/> <path d="M503.632,62.811c-5.332-5.327-11.8-7.993-19.41-7.993h-91.365c-7.61,0-14.086,2.663-19.417,7.993\n' +
    '			c-5.325,5.33-7.987,11.803-7.987,19.414v54.821c0,7.616,2.662,14.083,7.987,19.414c5.331,5.327,11.807,7.994,19.417,7.994h91.365\n' +
    '			c7.61,0,14.078-2.667,19.41-7.994s7.994-11.798,7.994-19.414V82.225C511.626,74.613,508.964,68.141,503.632,62.811z"/> <path d="M301.492,54.818h-91.361c-7.614,0-14.084,2.663-19.414,7.993s-7.992,11.803-7.992,19.414v54.821\n' +
    '			c0,7.616,2.662,14.083,7.992,19.414c5.327,5.327,11.8,7.994,19.414,7.994h91.361c7.618,0,14.086-2.664,19.418-7.994\n' +
    '			c5.325-5.327,7.994-11.798,7.994-19.414V82.225c0-7.611-2.662-14.084-7.994-19.414C315.578,57.484,309.11,54.818,301.492,54.818z"/> <path d="M484.222,200.999h-91.365c-7.61,0-14.086,2.664-19.417,7.994c-5.325,5.33-7.987,11.798-7.987,19.414v54.823\n' +
    '			c0,7.61,2.662,14.078,7.987,19.406c5.331,5.329,11.807,7.994,19.417,7.994h91.365c7.61,0,14.085-2.665,19.41-7.994\n' +
    '			c5.332-5.328,7.994-11.796,7.994-19.406v-54.823c0-7.616-2.662-14.087-7.994-19.414\n' +
    '			C498.3,203.663,491.833,200.999,484.222,200.999z"/> <path d="M484.222,347.177h-91.365c-7.61,0-14.086,2.662-19.417,7.994c-5.325,5.331-7.987,11.8-7.987,19.41v54.823\n' +
    '			c0,7.611,2.662,14.089,7.987,19.417c5.331,5.328,11.807,7.987,19.417,7.987h91.365c7.61,0,14.085-2.662,19.41-7.987\n' +
    '			c5.332-5.331,7.994-11.806,7.994-19.417v-54.823c0-7.61-2.662-14.085-7.994-19.41S491.833,347.177,484.222,347.177z"/> </g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> </svg>'
  );

}]);
