# Changelog

## [1.0.5] - 2022-12-05

### Fixed
 - RepeaterField and RepeaterTableField not respecting the :disabled attribute


## [1.0.4] - 2022-11-30

### Fixed
 - Bug where customDisplayValue was not displayed in NumberFields with null values
 - Prevent reloading of link alias objects during changes in other fields causing flicker


## [1.0.3] - 2022-11-16

### Added
 - New field type: `CustomSelectField` for choosing options from a dropdown with custom rendering
 - Ability to set the string used to display empty values with a provider
 - New option `extraParams` in `MediaField` which is passed into the MediaLibrary when searching - could be used to show only media of a certain type for example

### Fixed
 - Remove some code duplication passing props to FieldWrapper
 - A few bugfixes relating to view mode
 - Link github repository to npm package


## [1.0.2] - 2022-11-03

### Added
 - Max chars setting for TextField and TextAreaField with remaining chars countdown


## [1.0.1] - 2022-10-06

### Fixed
 - Fixed incorrect main file
 - Included scss directory in package


## [1.0.0] - 2022-10-06

First stable-ish version pushed to NPM
