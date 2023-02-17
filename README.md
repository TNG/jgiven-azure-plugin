# Azure DevOps - Publish JGiven Reports
This extension enables users to publish JGiven HTML reports to a newly created tab inside the DevOps console, next to the `Summary` tab.

# Usage
## 1. Install the extension from the marketplace
To install the JGiven Extension, perform the following steps:
* In Azure DevOps, navigate to *Organization Settings*.
* Choose *Extensions*.
* Click on *Browse marketplace*.
* Search for *JGiven*, choose the extension and click on *Get*.


## 2. Add a JGiven step in your Azure DevOps pipeline task

To activate the JGiven Extension, include the following step in your pipeline:
```
- script: ./gradlew -b build.gradle test
  displayName: '${some_name_to_display}'
```
Depending on your projects structure it might be necessary to provide a path to `build.gradle`, for example `jgiven-repository/build.gradle`.

## 3. Include a JGiven Task in your pipeline:

Add a task specification to your pipeline:
```
- task: publishjgivenreport@0
    inputs:
      jgivenReportPatterns: '${path_to_index.html} '**/html'
      #workingDir: 'custom/working/dir' #if not set, default value is $(Build.SourcesDirectory)
```
The `jgivenReportPatterns` contains the path to the folder where the file `index.html` is located.
The syntax for `jgivenReportPatterns` follows the Unix file name matcher mechanism. You may use wildcards such as `*` 
to match any number of characters or `**` to recursively match subdirectories.

For example, if `index.html` is included in a folder named `html5` the above task may include 

`jgivenReportPatterns: '**/html5'`

Further, jgivenReportPatterns supports input of multiple paths by separating the paths with a `#`, i.e.
 `jgivenReportPatterns: 'path_1#path_2#path_3'`

In case the working directory differs from `${Build.SourcesDirectory}` you may specify another working directory
via the `workingDir` parameter.

## 4. Verification

After executing the pipeline, a new tab in Azure DevOps will appear with content similar to
the following screenshot:
![JGiven Panel in Dev Ops](https://raw.githubusercontent.com/TNG/jgiven-azure-plugin/master/resources/screenshot.png "JGiven Dashboard")

# License

The JGiven Azure DevOps Plugin is published under the Apache License 2.0, see https://www.apache.org/licenses/LICENSE-2.0 or [LICENSE](https://github.com/TNG/jgiven-azure-plugin/blob/master/LICENSE) for details.

# Contributing
See [CONTRIBUTING](https://github.com/TNG/jgiven-azure-plugin/blob/master/CONTRIBUTING.md)

