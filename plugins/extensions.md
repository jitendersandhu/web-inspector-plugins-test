```javascript
javascript:(function()%7Bvar c%3D%7Bnamespace:"_cwPluginApp",url:"https://cdn.rawgit.com/jitendersandhu/web-inspector-plugins-test/master/plugins/angular/cwAngularPlugins.js",pluginName:"Inspector",cache:true,dependencies:%7Bcss:%5B"https://cdn.rawgit.com/jitendersandhu/web-inspector-plugins-test/master/plugins/styles/cw-plugin.min.css"%5D,js:%5B"https://ajax.googleapis.com/ajax/libs/angularjs/1.5.7/angular.min.js"%5D%7D%7D%3Bvar a%3Dfunction()%7B_cwPluginModule.run(c,function()%7B_cwPluginApp.init(%5B%7Bname:"event-inspector"%7D%5D)%7D)%7D%3Bif(!window._cwPluginModule)%7Bvar b%3Ddocument.createElement("script")%3Bb.setAttribute("src","https://cdn.rawgit.com/jitendersandhu/web-inspector-plugins-test/master/plugins/cwPluginInjector.js")%3Bdocument.getElementsByTagName("body")%5B0%5D.appendChild(b)%3Bb.onload%3Db.onreadystatechange%3Dfunction()%7Ba()%7D%7Delse%7Ba()%7D%7D)()%3B
```