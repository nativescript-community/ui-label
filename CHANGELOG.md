# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.3.41](https://github.com/nativescript-community/ui-label/compare/v1.3.40...v1.3.41) (2025-10-10)

### ⚠ BREAKING CHANGES

* **android:** added `androidA11yAdjustsFontSize` property. It is a breaking change in the sense that now it defaults to false. Before it was always on.

### Bug Fixes

* **android:** added `androidA11yAdjustsFontSize` property. It is a breaking change in the sense that now it defaults to false. Before it was always on. ([0dc755e](https://github.com/nativescript-community/ui-label/commit/0dc755ea7820663568ff2f46c6e13d5dccf1490f))

## [1.3.40](https://github.com/nativescript-community/ui-label/compare/v1.3.39...v1.3.40) (2025-09-29)

### Bug Fixes

* **ios:** another edge case for text as NSAttributedString ([691d460](https://github.com/nativescript-community/ui-label/commit/691d4607b4aca7a4ad83064976d974ed301f8cdc))

## [1.3.39](https://github.com/nativescript-community/ui-label/compare/v1.3.38...v1.3.39) (2025-09-29)

### Bug Fixes

* **ios:** autoFontSize working with NSAttributedString in text property ([2aadecf](https://github.com/nativescript-community/ui-label/commit/2aadecffedc2efd4bad14e8ad282250c69bd9c63))

## [1.3.38](https://github.com/nativescript-community/ui-label/compare/v1.3.34...v1.3.38) (2025-09-26)

### Bug Fixes

* **android:** wrong size for formattedstring spans ([07f6bc9](https://github.com/nativescript-community/ui-label/commit/07f6bc945141bf7419819db1144eb46af59bafba))

## [1.3.34](https://github.com/nativescript-community/ui-label/compare/v1.3.33...v1.3.34) (2025-09-05)

### Bug Fixes

* **android:** fix after latest @nativescript-community/text changes ([93a446f](https://github.com/nativescript-community/ui-label/commit/93a446f8ccc337462a9657925bc8128a8a25e1d7))
* use weakref when possible ([5553241](https://github.com/nativescript-community/ui-label/commit/55532415e218da8040dd4aeabf014b7c77f8e9ba))

## [1.3.33](https://github.com/nativescript-community/ui-label/compare/v1.3.32...v1.3.33) (2024-12-16)

### Bug Fixes

* text/html can now be native NSAttributedString or Spannable ([12f35db](https://github.com/nativescript-community/ui-label/commit/12f35db6ce76cd8ffc2b31b82cf3dd647dea87d0))

## [1.3.32](https://github.com/nativescript-community/ui-label/compare/v1.3.31...v1.3.32) (2024-09-19)

### Bug Fixes

-   **android:** regression fix ([f991000](https://github.com/nativescript-community/ui-label/commit/f991000339589b20a8cf5f98f561e3e14330bec9))

## [1.3.31](https://github.com/nativescript-community/ui-label/compare/v1.3.30...v1.3.31) (2024-09-19)

**Note:** Version bump only for package @nativescript-community/ui-label

## [1.3.30](https://github.com/nativescript-community/ui-label/compare/v1.3.29...v1.3.30) (2024-09-18)

### Bug Fixes

-   **android:** now the properties order is html/text/formattedString(children) ([f6fadd2](https://github.com/nativescript-community/ui-label/commit/f6fadd2cffc95be49eed3641d872c47d7fb0ae9a))

## [1.3.29](https://github.com/nativescript-community/ui-label/compare/v1.3.28...v1.3.29) (2024-05-22)

### Bug Fixes

-   **ios:** broken build after @nativescript-community/text update ([544c048](https://github.com/nativescript-community/ui-label/commit/544c048a8458fca4785a17a1bf64978aa3f7a3b2))

## [1.3.28](https://github.com/nativescript-community/ui-label/compare/v1.3.27...v1.3.28) (2024-05-22)

### Bug Fixes

-   **android:** missing fontVariationSettings support ([6b54a52](https://github.com/nativescript-community/ui-label/commit/6b54a52391fa156e95a207bcdda4c4bde6e764bb))

## [1.3.27](https://github.com/nativescript-community/ui-label/compare/v1.3.26...v1.3.27) (2024-05-02)

### Bug Fixes

-   typings fix ([4f30f72](https://github.com/nativescript-community/ui-label/commit/4f30f7283f226bf268d32d6f1c0d8854edbf0420))

## [1.3.26](https://github.com/Akylas/nativescript-label/compare/v1.3.25...v1.3.26) (2024-03-18)

### Bug Fixes

-   **ios:** formattedtext not working with button ([707ac80](https://github.com/Akylas/nativescript-label/commit/707ac80f719927c0964778d3753e9ed116c0c917))

## [1.3.25](https://github.com/Akylas/nativescript-label/compare/v1.3.24...v1.3.25) (2024-03-06)

### Bug Fixes

-   **ios:** multiple fixes for autoFonSize ([f41473e](https://github.com/Akylas/nativescript-label/commit/f41473e7429606017beb427fd9fe70e06d1a082f))

## [1.3.24](https://github.com/nativescript-community/ui-label/compare/v1.3.23...v1.3.24) (2024-03-05)

### Bug Fixes

-   **android:** regression fix ([07ec72b](https://github.com/nativescript-community/ui-label/commit/07ec72b6ef92d49ced93c70cd38dcd5c9a30f6bc))

## [1.3.23](https://github.com/nativescript-community/ui-label/compare/v1.3.22...v1.3.23) (2024-03-05)

### Bug Fixes

-   **android:** prevent enableAutoSize to be called before min and max font size are set ([b1cdfd7](https://github.com/nativescript-community/ui-label/commit/b1cdfd738a1ba9c647f1d1ffff9c6ea12cc5b908))

## [1.3.22](https://github.com/nativescript-community/ui-label/compare/v1.3.21...v1.3.22) (2024-02-22)

### Bug Fixes

-   **android:** wrong line height rendering on android < 28 ([4276ad6](https://github.com/nativescript-community/ui-label/commit/4276ad6494271f924ae5eafedfaa6f3e65607d95))

## [1.3.21](https://github.com/Akylas/nativescript-label/compare/v1.3.20...v1.3.21) (2024-02-15)

### Bug Fixes

-   **ios:** more verticalAlignment/autoSize fixes ([44d5752](https://github.com/Akylas/nativescript-label/commit/44d575226f824bba8fe256719820f9b64ed78e62))

## [1.3.20](https://github.com/Akylas/nativescript-label/compare/v1.3.19...v1.3.20) (2024-02-12)

### Bug Fixes

-   **ios:** verticalTextAlignment fix ([528ccb9](https://github.com/Akylas/nativescript-label/commit/528ccb97f6612435c84397dc2cb09b24832065ba))

## [1.3.19](https://github.com/Akylas/nativescript-label/compare/v1.3.18...v1.3.19) (2024-02-12)

### Bug Fixes

-   **ios:** ensure verticalTextAlignment works in all cases ([05ed697](https://github.com/Akylas/nativescript-label/commit/05ed697ad415f0d93608d9011599446b5d347afa))

## [1.3.18](https://github.com/nativescript-community/ui-label/compare/v1.3.17...v1.3.18) (2024-01-30)

### Bug Fixes

-   **android:** native-api-usage fix ([a3476e7](https://github.com/nativescript-community/ui-label/commit/a3476e74baacf28bc4da9d8254f2edbfb733d277))

## [1.3.17](https://github.com/nativescript-community/ui-label/compare/v1.3.16...v1.3.17) (2024-01-25)

### Bug Fixes

-   **android:** refactoring to improve native-api-usage ([53d57f8](https://github.com/nativescript-community/ui-label/commit/53d57f894e6d9360712619e2426430e970ee9e58))

## [1.3.16](https://github.com/nativescript-community/ui-label/compare/v1.3.15...v1.3.16) (2024-01-23)

### Bug Fixes

-   **android:** native-api-usage improvements ([98e8238](https://github.com/nativescript-community/ui-label/commit/98e823841298988f08a5d13f088b578b8e5cf5e8))

## [1.3.15](https://github.com/nativescript-community/ui-label/compare/v1.3.14...v1.3.15) (2024-01-23)

### Bug Fixes

-   ensure we use latest @nativescript-community/text ([214589e](https://github.com/nativescript-community/ui-label/commit/214589ee1fbeeadbac5c5b083cfbc117244e0ccd))

## [1.3.14](https://github.com/nativescript-community/ui-label/compare/v1.3.13...v1.3.14) (2024-01-23)

### Bug Fixes

-   **android:** faster and lighter(using proguard/native-api-usage) implementation ([74e0b8f](https://github.com/nativescript-community/ui-label/commit/74e0b8f8ea484bc2ed4aa770d885f5f258c9fee7))
-   **android:** some improvements to make `Label` a bit faster ([982673b](https://github.com/nativescript-community/ui-label/commit/982673b0744b8761635383bb5eeba24415470e38))

## [1.3.13](https://github.com/nativescript-community/ui-label/compare/v1.3.12...v1.3.13) (2024-01-18)

### Bug Fixes

-   allow native attributed string (NSAttributedString and android.text.Spannable) to be used as `text` ([740478f](https://github.com/nativescript-community/ui-label/commit/740478f6ceb66117830981117bebb8219a440a4c))
-   **android:** fix font size for html/spans which was a bit smaller than normal `text`. WARNING: it will change font size a bit (bigger) for all labels using html or FormattedString/Span ([5c34149](https://github.com/nativescript-community/ui-label/commit/5c3414927ba90e3e7d8e71cd54287f792eb1cf37))

## [1.3.12](https://github.com/nativescript-community/ui-label/compare/v1.3.11...v1.3.12) (2024-01-18)

### Bug Fixes

-   **android:** renamed label layout so that we can easily keep it with proguard/minification ([2597a97](https://github.com/nativescript-community/ui-label/commit/2597a972a0796b02e0be024910dc3b4e7fbdd048))

## [1.3.11](https://github.com/nativescript-community/ui-label/compare/v1.3.10...v1.3.11) (2024-01-16)

### Bug Fixes

-   **android:** regression fix ([6691c44](https://github.com/nativescript-community/ui-label/commit/6691c44aebef47abafb40b43450163caf89442ca))

## [1.3.10](https://github.com/nativescript-community/ui-label/compare/v1.3.9...v1.3.10) (2024-01-14)

### Bug Fixes

-   **android:** create native view using inflate (a bit faster) ([10ecedf](https://github.com/nativescript-community/ui-label/commit/10ecedf40395da22f2b5d78eaab17ac50cebd1ae))

## [1.3.9](https://github.com/nativescript-community/ui-label/compare/v1.3.8...v1.3.9) (2023-12-29)

### Bug Fixes

-   **android:** proguard fix (for app supporting proguard) ([9d92693](https://github.com/nativescript-community/ui-label/commit/9d92693583b37ed6fd62bf01d4d3d4e568f244ed))

## [1.3.8](https://github.com/nativescript-community/ui-label/compare/v1.3.7...v1.3.8) (2023-09-06)

### Bug Fixes

-   updated `@nativescript-community/text` to fix linkColor issue ([e9235ec](https://github.com/nativescript-community/ui-label/commit/e9235ecdf5eac2c44083cc5ed818f4128ee1014b))

## [1.3.7](https://github.com/nativescript-community/ui-label/compare/v1.3.6...v1.3.7) (2023-08-12)

### Bug Fixes

-   **android:** faster fontSize property ([9d771d9](https://github.com/nativescript-community/ui-label/commit/9d771d924b65c3a9b3420c8cedfe0532fe0d3b60))

## [1.3.6](https://github.com/nativescript-community/ui-label/compare/v1.3.5...v1.3.6) (2023-06-08)

### Bug Fixes

-   **android:** native-api-usage fix ([022d55f](https://github.com/nativescript-community/ui-label/commit/022d55f9111e5e049c40adc3d0fbbde5c789cbfd))

## [1.3.5](https://github.com/Akylas/nativescript-label/compare/v1.3.4...v1.3.5) (2023-05-16)

### Bug Fixes

-   **android:** linkColor and underline not working anymore ([65d79dd](https://github.com/Akylas/nativescript-label/commit/65d79dd7d358725e1a634ebb5ffb8873e0a305c9))

## [1.3.4](https://github.com/Akylas/nativescript-label/compare/v1.3.3...v1.3.4) (2023-05-14)

### Bug Fixes

-   **ios:** tap event not working anymore ([ee70746](https://github.com/Akylas/nativescript-label/commit/ee70746117908abb542c19f71ad2a9e47ce98290))

## [1.3.3](https://github.com/Akylas/nativescript-label/compare/v1.3.2...v1.3.3) (2023-05-13)

**Note:** Version bump only for package @nativescript-community/ui-label

## [1.3.2](https://github.com/Akylas/nativescript-label/compare/v1.3.1...v1.3.2) (2023-05-12)

### Bug Fixes

-   **android:** faster formattedText / html creation ([fea5249](https://github.com/Akylas/nativescript-label/commit/fea524999766bf90ad109a1d180dac86151fe59a))
-   **ios:** linkColor fix ([d690423](https://github.com/Akylas/nativescript-label/commit/d690423567601405687204f4302f0fa8e8da45b4))

## [1.3.1](https://github.com/Akylas/nativescript-label/compare/v1.3.0...v1.3.1) (2023-05-11)

### Bug Fixes

-   `__UI_LABEL_USE_LIGHT_FORMATTEDSTRING__` support to force use of `LightFormattedString` ([fb1d8d0](https://github.com/Akylas/nativescript-label/commit/fb1d8d04e949f7e992be24b7d17129d7a9382257))

# [1.3.0](https://github.com/Akylas/nativescript-label/compare/v1.2.27...v1.3.0) (2023-05-10)

### Features

-   **ios:** big rewrite using UILabel (when not selectable) for a much faster component ([feff416](https://github.com/Akylas/nativescript-label/commit/feff416761fc78aa415125aa5cbb193efafff924))

## [1.2.27](https://github.com/Akylas/nativescript-label/compare/v1.2.26...v1.2.27) (2023-04-20)

### Bug Fixes

-   **ios:** fix issue with color not applied on html ([8394d7d](https://github.com/Akylas/nativescript-label/commit/8394d7d919425d71bfd9cd80df894cbb9ebd0aa6))

## [1.2.26](https://github.com/Akylas/nativescript-label/compare/v1.2.25...v1.2.26) (2023-04-01)

### Bug Fixes

-   linkUnderline and linkColor now correctly working ([da7c13d](https://github.com/Akylas/nativescript-label/commit/da7c13db016bdad8ca19c80a8f88a47796f02af7))

## [1.2.25](https://github.com/Akylas/nativescript-label/compare/v1.2.24...v1.2.25) (2023-03-21)

### Bug Fixes

-   **ios:** crash fix which could happen while removing a label view ([18903f1](https://github.com/Akylas/nativescript-label/commit/18903f186d05e0d413b61ecb1a188e488d17a2e5))

## [1.2.24](https://github.com/nativescript-community/ui-label/compare/v1.2.23...v1.2.24) (2023-03-13)

### Bug Fixes

-   update auto font size on min/max fontSize change ([38d8356](https://github.com/nativescript-community/ui-label/commit/38d8356f63f60a795100e295e4e560de6b526ee7))

## [1.2.23](https://github.com/Akylas/nativescript-label/compare/v1.2.22...v1.2.23) (2023-02-25)

### Bug Fixes

-   **ios:** fixed autoFontSize computation when text can get bigger ([955d7d0](https://github.com/Akylas/nativescript-label/commit/955d7d07db5df8285a86ec673aaffc0ae47126f8))
-   **ios:** update autoFontSize when needed ([d12a792](https://github.com/Akylas/nativescript-label/commit/d12a79261a7bd61b936bfe5b8c7a80c47c404307))

## [1.2.22](https://github.com/Akylas/nativescript-label/compare/v1.2.21...v1.2.22) (2023-02-20)

### Bug Fixes

-   **android:** fix for `@nativescript-community/text` override and light spans ([9241a0d](https://github.com/Akylas/nativescript-label/commit/9241a0d7372b7ddc0e452d6704e96872b6fcb6fe))

## [1.2.21](https://github.com/nativescript-community/ui-label/compare/v1.2.20...v1.2.21) (2023-01-30)

### Bug Fixes

-   **android:** dont check urlspan if not needed ([ae17045](https://github.com/nativescript-community/ui-label/commit/ae17045b332a8577ad7bd385f08e9603b865fa9f))

## [1.2.20](https://github.com/nativescript-community/ui-label/compare/v1.2.19...v1.2.20) (2023-01-24)

### Bug Fixes

-   **android:** native-api-usage fix ([ffa6a5d](https://github.com/nativescript-community/ui-label/commit/ffa6a5dabaa6d0bfd0350bb0817e947648bb2e76))

## [1.2.19](https://github.com/Akylas/nativescript-label/compare/v1.2.18...v1.2.19) (2023-01-17)

### Bug Fixes

-   **ios:** span click triggered on wrong span ([afa0f8f](https://github.com/Akylas/nativescript-label/commit/afa0f8f95c30bed44cf7a0755442315108923f16))

## [1.2.18](https://github.com/Akylas/nativescript-label/compare/v1.2.17...v1.2.18) (2023-01-17)

**Note:** Version bump only for package @nativescript-community/ui-label

## [1.2.17](https://github.com/Akylas/nativescript-label/compare/v1.2.16...v1.2.17) (2023-01-12)

### Bug Fixes

-   **ios:** linkTap fix for html ([8469951](https://github.com/Akylas/nativescript-label/commit/8469951477ce1d478507ef0b76f4d0b1290a89c9))
-   **ios:** more N 8.4 fixes ([3d7ac2e](https://github.com/Akylas/nativescript-label/commit/3d7ac2e72282f602ec8c9d90c1eb8eed5f80500c))

## [1.2.16](https://github.com/Akylas/nativescript-label/compare/v1.2.15...v1.2.16) (2022-12-01)

**Note:** Version bump only for package @nativescript-community/ui-label

## [1.2.15](https://github.com/nativescript-community/ui-label/compare/v1.2.14...v1.2.15) (2022-11-21)

### Bug Fixes

-   broken build ([cb91f08](https://github.com/nativescript-community/ui-label/commit/cb91f086a8f2879aa2ce6fff46ef894c1fb0e954))

## [1.2.14](https://github.com/nativescript-community/ui-label/compare/v1.2.13...v1.2.14) (2022-11-20)

### Bug Fixes

-   maxLines not working properly ([98b298f](https://github.com/nativescript-community/ui-label/commit/98b298f20404d4e7f6f1e98a99e4a693c45b0c37))

## [1.2.13](https://github.com/Akylas/nativescript-label/compare/v1.2.12...v1.2.13) (2022-11-02)

### Bug Fixes

-   **ios:** prevent some html labels to use Times New Roman font instead of default ([01c9f81](https://github.com/Akylas/nativescript-label/commit/01c9f81ef341643ccaa615a7a06c94a4cfdbc092))

## [1.2.12](https://github.com/Akylas/nativescript-label/compare/v1.2.11...v1.2.12) (2022-09-16)

### Bug Fixes

-   **ios:** correctly handle `linkTap` using UITextView methods ([1b1ab83](https://github.com/Akylas/nativescript-label/commit/1b1ab83b4b1e613da528d6c28383d9310dec3f03))

## [1.2.11](https://github.com/Akylas/nativescript-label/compare/v1.2.10...v1.2.11) (2022-09-09)

### Bug Fixes

-   **ios:** `textAlignment` not working with `letterSpacing` ([237771a](https://github.com/Akylas/nativescript-label/commit/237771a9ff9d7cac35a3d81c1048018b2ff95be5))

## [1.2.10](https://github.com/Akylas/nativescript-label/compare/v1.2.9...v1.2.10) (2022-09-01)

### Bug Fixes

-   **ios:** fix for html label not layouting correctly ([500a25c](https://github.com/Akylas/nativescript-label/commit/500a25c38b7ff64c828e4888ef41239742e416f4))

## [1.2.9](https://github.com/Akylas/nativescript-label/compare/v1.2.8...v1.2.9) (2022-07-22)

### Bug Fixes

-   `maxLines` fix for latest N ([36763fd](https://github.com/Akylas/nativescript-label/commit/36763fd3b27c78e2b7b75007cf927d8acd816dda))

## [1.2.8](https://github.com/Akylas/nativescript-label/compare/v1.2.7...v1.2.8) (2022-04-26)

**Note:** Version bump only for package @nativescript-community/ui-label

## [1.2.7](https://github.com/Akylas/nativescript-label/compare/v1.2.6...v1.2.7) (2022-04-05)

### Bug Fixes

-   **ios:** autoFontSize fix broken font formatting on measure ([5229637](https://github.com/Akylas/nativescript-label/commit/52296377eb69623144aa063a870ac8a0f8ffa03e))

## [1.2.6](https://github.com/Akylas/nativescript-label/compare/v1.2.5...v1.2.6) (2022-02-09)

### Bug Fixes

-   **ios:** another fix for flexbox layout ([9c4d55e](https://github.com/Akylas/nativescript-label/commit/9c4d55e511ca1d6f2d3bf51dcc59188b3e3e54c8))
-   **ios:** fix color change with HTML / formattedString ([4de4d80](https://github.com/Akylas/nativescript-label/commit/4de4d803556d5d5bee0745b2f60e3eee6e3caca2))

## [1.2.5](https://github.com/Akylas/nativescript-label/compare/v1.2.4...v1.2.5) (2022-02-09)

### Bug Fixes

-   **ios:** fix for flexbox. ([2c0e06d](https://github.com/Akylas/nativescript-label/commit/2c0e06d6292b25165729bce17384ca5d334ad538))

## [1.2.4](https://github.com/Akylas/nativescript-label/compare/v1.2.3...v1.2.4) (2022-01-14)

### Bug Fixes

-   uglify fix ([f04189f](https://github.com/Akylas/nativescript-label/commit/f04189f9838615d4eb037a6423fd245538860358))

## [1.2.3](https://github.com/Akylas/nativescript-label/compare/v1.2.2...v1.2.3) (2022-01-13)

### Bug Fixes

-   **android:** autoFontSize not working in some cases ([f70af75](https://github.com/Akylas/nativescript-label/commit/f70af75ec26674b4ed7b9a1585489243ac525ad3))

## [1.2.2](https://github.com/Akylas/nativescript-label/compare/v1.2.1...v1.2.2) (2022-01-08)

### Bug Fixes

-   **android:** wrong api level for `setJustificationMode` [#11](https://github.com/Akylas/nativescript-label/issues/11) ([f4b0c05](https://github.com/Akylas/nativescript-label/commit/f4b0c051336e292ac4970933609f21d55da26257))

## [1.2.1](https://github.com/Akylas/nativescript-label/compare/v1.2.0...v1.2.1) (2022-01-02)

### Bug Fixes

-   **android:** correctly set lineHeight on android >= 28 ([3a48c74](https://github.com/Akylas/nativescript-label/commit/3a48c740fcffbb781994b9b0b6b22c0779cb9b5c))
-   **ios:** lineHeight and letterSpacing fix ([ddc90c7](https://github.com/Akylas/nativescript-label/commit/ddc90c785af7e37e3c0e01cee2be2b1e07f957a5))

# [1.2.0](https://github.com/Akylas/nativescript-label/compare/v1.1.25...v1.2.0) (2021-10-20)

### Bug Fixes

-   **android:** justify text alignment support ([f26d74b](https://github.com/Akylas/nativescript-label/commit/f26d74b7831052dd8188bd6cfaf1db19e01a34f4))
-   **ios:** verticalTextAligment fix in some cases ([00ae666](https://github.com/Akylas/nativescript-label/commit/00ae666f22b9a697f1fa7eb7b4c8640216dd0f0d))

### Features

-   **android:** native-api-usage ([40d28dd](https://github.com/Akylas/nativescript-label/commit/40d28dd648d993f1a7d844c677e20e8dfb1d67c0))

## [1.1.25](https://github.com/Akylas/nativescript-label/compare/v1.1.24...v1.1.25) (2021-08-09)

### Bug Fixes

-   **ios:** some autoFontSize optimisations ([1712f4f](https://github.com/Akylas/nativescript-label/commit/1712f4fb278a8dc2d0d20ab602aabfefdf2f3148))

## [1.1.24](https://github.com/Akylas/nativescript-label/compare/v1.1.23...v1.1.24) (2021-08-09)

### Bug Fixes

-   **ios:** autoFontSize not omputed ([d0564ea](https://github.com/Akylas/nativescript-label/commit/d0564eab8dac4c0fa20c2367b31a64b79f1845b7))

## [1.1.23](https://github.com/Akylas/nativescript-label/compare/v1.1.22...v1.1.23) (2021-08-08)

### Bug Fixes

-   **ios:** rollback to fix color not being set ([3cab1d7](https://github.com/Akylas/nativescript-label/commit/3cab1d71e3bf9a0e9a962fd65611aa25a1be072a))

## [1.1.22](https://github.com/Akylas/nativescript-label/compare/v1.1.21...v1.1.22) (2021-08-07)

### Features

-   autoFontSizeStep ([388256e](https://github.com/Akylas/nativescript-label/commit/388256e9a531d9ce63cded54225632af1c4dc84f))

## [1.1.21](https://github.com/Akylas/nativescript-label/compare/v1.1.20...v1.1.21) (2021-08-07)

### Bug Fixes

-   **ios:** fix crashes with html text in pager ([404c0c0](https://github.com/Akylas/nativescript-label/commit/404c0c0b41ec96e4e5bb749ec74b62d400541d35))

## [1.1.20](https://github.com/Akylas/nativescript-label/compare/v1.1.19...v1.1.20) (2021-08-04)

### Bug Fixes

-   **ios:** fix for html + collectionview/pager ([a19b3c8](https://github.com/Akylas/nativescript-label/commit/a19b3c85e837da716a877a8a98f96f2b32416aec))
-   prevent error if null ([ea52954](https://github.com/Akylas/nativescript-label/commit/ea529548bdafa9413a5435a2b857be49ff7b875f))

## [1.1.19](https://github.com/Akylas/nativescript-label/compare/v1.1.18...v1.1.19) (2021-08-04)

### Bug Fixes

-   some color fixes ([7837e47](https://github.com/Akylas/nativescript-label/commit/7837e47db05c8528ca13541509f6c3bcb0eba1fb))

## [1.1.18](https://github.com/Akylas/nativescript-label/compare/v1.1.17...v1.1.18) (2021-08-04)

### Bug Fixes

-   default link color to null ([668ec19](https://github.com/Akylas/nativescript-label/commit/668ec19f9ac960abd93c8c174c6738e3f7d93594))

## [1.1.17](https://github.com/Akylas/nativescript-label/compare/v1.1.16...v1.1.17) (2021-07-01)

### Bug Fixes

-   **ios:** wrong font size applied with html text ([62b88c0](https://github.com/Akylas/nativescript-label/commit/62b88c0d5d932b98c3536149e9bfe16d1f0693db))
-   more autofontsize fixes ([618bd55](https://github.com/Akylas/nativescript-label/commit/618bd55e3ae00d6bbdbe06aee3ebdf01a90869ac))

## [1.1.16](https://github.com/Akylas/nativescript-label/compare/v1.1.15...v1.1.16) (2021-05-03)

### Bug Fixes

-   **ios:** autoFontSize fix with html text (breaks some font size in it) ([4dec254](https://github.com/Akylas/nativescript-label/commit/4dec2549a670a116dff11fe5cec03054ef5d062e))

## [1.1.15](https://github.com/Akylas/nativescript-label/compare/v1.1.14...v1.1.15) (2021-04-23)

### Bug Fixes

-   **ios:** autoFontSize fix and make it faster ([b07d764](https://github.com/Akylas/nativescript-label/commit/b07d7641592601f92eebe711ea2ae12b8aa46ccd))

## [1.1.14](https://github.com/Akylas/nativescript-label/compare/v1.1.13...v1.1.14) (2021-04-19)

### Bug Fixes

-   **ios:** ensure we use autoFontSize in onMeasure ([3e0eb6e](https://github.com/Akylas/nativescript-label/commit/3e0eb6ebcfc367b096a595188bf3f8ac3330163c))

## [1.1.13](https://github.com/Akylas/nativescript-label/compare/v1.1.12...v1.1.13) (2021-04-14)

### Bug Fixes

-   NS8 and use createFormattedTextNative ([ee76186](https://github.com/Akylas/nativescript-label/commit/ee76186bf43da2fe8709856d6ae95a61f058ebe5))

## [1.1.12](https://github.com/Akylas/nativescript-label/compare/v1.1.11...v1.1.12) (2021-04-05)

### Bug Fixes

-   **ios:** support autosize for 1 line labels (based on width) ([08ed0cb](https://github.com/Akylas/nativescript-label/commit/08ed0cbe94d91d9fd51b55edea1b92355dd1ea9f))
-   bring back max nblines with textWrap ([117bbad](https://github.com/Akylas/nativescript-label/commit/117bbadc2d90501df4c9abc29d663feb610d2d1b))
-   ios remove unwanted padding ([4c335fe](https://github.com/Akylas/nativescript-label/commit/4c335feb05400a84e14e6997fe34377c3a36369d))

## [1.1.11](https://github.com/Akylas/nativescript-label/compare/v1.1.10...v1.1.11) (2021-04-02)

### Bug Fixes

-   **ios:** autoFontSize fixe ([e5a50f4](https://github.com/Akylas/nativescript-label/commit/e5a50f4a903a2af6649b2f4e6a967d0c7f689d69))

## [1.1.10](https://github.com/Akylas/nativescript-label/compare/v1.1.9...v1.1.10) (2021-03-26)

### Bug Fixes

-   **ios:** regression after last commits ([33c35e5](https://github.com/Akylas/nativescript-label/commit/33c35e5315048287fa376163051883575414a1e1))

## [1.1.9](https://github.com/Akylas/nativescript-label/compare/v1.1.8...v1.1.9) (2021-03-26)

### Bug Fixes

-   autoFontSize now can use minFontSize and maxFontSize ([ac221d4](https://github.com/Akylas/nativescript-label/commit/ac221d4175e42b654d452b133719940acc96fa2e))

## [1.1.8](https://github.com/Akylas/nativescript-label/compare/v1.1.7...v1.1.8) (2021-03-24)

### Bug Fixes

-   **ios:** some autoFontSize fixes ([0afb433](https://github.com/Akylas/nativescript-label/commit/0afb4338bbdcd29e4b311ed02a952c2b216cf797))

## [1.1.7](https://github.com/Akylas/nativescript-label/compare/v1.1.6...v1.1.7) (2021-03-16)

### Bug Fixes

-   **ios:** ensure labels with html measure correctly in list views ([4314d3f](https://github.com/Akylas/nativescript-label/commit/4314d3f1da1b29bd02fb3980a47e515fe59c8dcc))

## [1.1.6](https://github.com/Akylas/nativescript-label/compare/v1.1.5...v1.1.6) (2021-03-16)

### Bug Fixes

-   **ios:** support fontWeight in html text ([114b439](https://github.com/Akylas/nativescript-label/commit/114b439a80742d8a4317364242c6f44b81dc7ed1))

### Features

-   selectable property ([a85f4d0](https://github.com/Akylas/nativescript-label/commit/a85f4d01e79358bfe8d018bc06267c1df339deda))

## [1.1.5](https://github.com/Akylas/nativescript-label/compare/v1.1.4...v1.1.5) (2021-03-15)

### Bug Fixes

-   **android:** ellipsing fix ([28ecba1](https://github.com/Akylas/nativescript-label/commit/28ecba1c019cdd4c805bff151223c7652c07f367))

### Features

-   autoFontSize basic support ([d7e5026](https://github.com/Akylas/nativescript-label/commit/d7e5026b66cf3b94a63166b357699847ad6bc608))

## [1.1.4](https://github.com/Akylas/nativescript-label/compare/v1.1.3...v1.1.4) (2021-03-13)

### Bug Fixes

-   **android:** ellipsing fix ([a1339a5](https://github.com/Akylas/nativescript-label/commit/a1339a57f5812945dc689fde81673034d261995a))

## [1.1.3](https://github.com/Akylas/nativescript-label/compare/v1.1.2...v1.1.3) (2021-03-13)

### Bug Fixes

-   **android:** ellipsing (lineBreak) fix ([d9b314e](https://github.com/Akylas/nativescript-label/commit/d9b314e77753dc320197a614ffa4c177275faa22))

## [1.1.2](https://github.com/Akylas/nativescript-label/compare/v1.1.1...v1.1.2) (2021-03-08)

**Note:** Version bump only for package @nativescript-community/ui-label

## [1.1.1](https://github.com/Akylas/nativescript-label/compare/v1.1.0...v1.1.1) (2021-02-16)

### Bug Fixes

-   **ios:** vertical aligment fix when using padding ([9f88025](https://github.com/Akylas/nativescript-label/commit/9f88025d210761afb0e70551a421923a21c81523))

# [1.1.0](https://github.com/Akylas/nativescript-label/compare/v1.0.61...v1.1.0) (2021-02-12)

### Features

-   better handle of span verticalAlignment ([e9cf77d](https://github.com/Akylas/nativescript-label/commit/e9cf77d9406ce4588adcd2ed8b535406d000da1d))

## [1.0.61](https://github.com/Akylas/nativescript-label/compare/v1.0.60...v1.0.61) (2020-12-20)

### Bug Fixes

-   faster properties ([63aecfa](https://github.com/Akylas/nativescript-label/commit/63aecfa45c17abf4a38bdbbb00b3c42afc7dd053))

## [1.0.60](https://github.com/Akylas/nativescript-label/compare/v1.0.59...v1.0.60) (2020-11-27)

### Bug Fixes

-   ios fix after last commit on vertical text alignment ([9621856](https://github.com/Akylas/nativescript-label/commit/9621856d7f90e79d4e8c6bbaab6f820e2c89d2cb))

## [1.0.59](https://github.com/Akylas/nativescript-label/compare/v1.0.58...v1.0.59) (2020-11-26)

**Note:** Version bump only for package @nativescript-community/ui-label

## [1.0.58](https://github.com/Akylas/nativescript-label/compare/v1.0.57...v1.0.58) (2020-11-26)

### Bug Fixes

-   ios fix for padding and verticalAlignment ([46d95af](https://github.com/Akylas/nativescript-label/commit/46d95af8ce02acb3231bc89ea59c49147d424743))

## [1.0.57](https://github.com/Akylas/nativescript-label/compare/v1.0.56...v1.0.57) (2020-11-23)

### Bug Fixes

-   dep update ([d1913db](https://github.com/Akylas/nativescript-label/commit/d1913db1b81183501367ad5d6550472ee7ed6b10))

## [1.0.56](https://github.com/Akylas/nativescript-label/compare/v1.0.55...v1.0.56) (2020-11-23)

**Note:** Version bump only for package @nativescript-community/ui-label

## [1.0.55](https://github.com/nativescript-community/ui-label/compare/v1.0.54...v1.0.55) (2020-11-22)

**Note:** Version bump only for package @nativescript-community/ui-label

## [1.0.54](https://github.com/Akylas/nativescript-label/compare/v1.0.53...v1.0.54) (2020-11-16)

### Features

-   linkColor, linkUnderline and linkTap for html ([8215f36](https://github.com/Akylas/nativescript-label/commit/8215f36a82504695c60a944c4fdcaa8e75873aae))

## [1.0.53](https://github.com/Akylas/nativescript-label/compare/v1.0.52...v1.0.53) (2020-10-29)

### Bug Fixes

-   update text for crash ([a592fe9](https://github.com/Akylas/nativescript-label/commit/a592fe95afaa9ac12a195f8735dd752bfddeb856))

## [1.0.52](https://github.com/Akylas/nativescript-label/compare/v1.0.51...v1.0.52) (2020-10-23)

### Bug Fixes

-   support latest text plugin ([2d200bc](https://github.com/Akylas/nativescript-label/commit/2d200bc0243338eb1752701f3fbd8e106491e72b))

## [1.0.51](https://github.com/Akylas/nativescript-label/compare/v1.0.50...v1.0.51) (2020-10-23)

### Bug Fixes

-   clickable span support ([64e600e](https://github.com/Akylas/nativescript-label/commit/64e600e3640a60396fd8d10495b5cf9e60b6e664))

## [1.0.50](https://github.com/Akylas/nativescript-label/compare/v1.0.49...v1.0.50) (2020-10-21)

### Bug Fixes

-   ios letterSpacing was breaking other attributes ([953b90a](https://github.com/Akylas/nativescript-label/commit/953b90aed0d850919ce012ce5c74de81da0ae4a0))

## [1.0.49](https://github.com/Akylas/nativescript-label/compare/v1.0.48...v1.0.49) (2020-10-11)

### Bug Fixes

-   ios fix wrong color on text change ([7a18519](https://github.com/Akylas/nativescript-label/commit/7a18519246e1dea390c4abc42755226b2e3ac76a))

## [1.0.48](https://github.com/Akylas/nativescript-label/compare/v1.0.47...v1.0.48) (2020-10-10)

**Note:** Version bump only for package @nativescript-community/ui-label

## [1.0.47](https://github.com/Akylas/nativescript-label/compare/v1.0.46...v1.0.47) (2020-10-08)

### Bug Fixes

-   android inherit AppCompatTextView ([01ce47e](https://github.com/Akylas/nativescript-label/commit/01ce47e675b439fd385324f4eaadb686f6550d28))
-   typings fix ([f78b6bf](https://github.com/Akylas/nativescript-label/commit/f78b6bf4e8cd79df6146be21aa6de01528176264))
-   use @nativescript-community/text ([d0c58d5](https://github.com/Akylas/nativescript-label/commit/d0c58d524c02625480fb128434bbfaae434fe1e6))

## [1.0.46](https://github.com/Akylas/nativescript-label/compare/v1.0.45...v1.0.46) (2020-10-07)

### Bug Fixes

-   some android font loading fixes ([d7ae654](https://github.com/Akylas/nativescript-label/commit/d7ae65416717bddbc0f1cd4ce0ac0632d212a7c5))

## [1.0.45](https://github.com/nativescript-community/ui-label/compare/v1.0.44...v1.0.45) (2020-09-08)

### Bug Fixes

-   **ios:** crash ([67b1d6e](https://github.com/nativescript-community/ui-label/commit/67b1d6e71d22e17c0f28d250042dfe7fd2a93062))

## [1.0.44](https://github.com/nativescript-community/ui-label/compare/v1.0.43...v1.0.44) (2020-09-06)

**Note:** Version bump only for package @nativescript-community/ui-label

## [1.0.43](https://github.com/nativescript-community/ui-label/compare/v1.0.42...v1.0.43) (2020-08-07)

**Note:** Version bump only for package @nativescript-community/ui-label

## [1.0.42](https://github.com/nativescript-community/ui-label/compare/v1.0.41...v1.0.42) (2020-08-07)

**Note:** Version bump only for package @nativescript-community/ui-label

## [1.0.41](https://github.com/nativescript-community/ui-label/compare/v1.0.40...v1.0.41) (2020-07-26)

### Bug Fixes

-   **android:** fix crash ([d6c4606](https://github.com/nativescript-community/ui-label/commit/d6c46066966789d3f0bcb93177ca1233377eb9b1))

## [1.0.40](https://github.com/nativescript-community/ui-label/compare/v1.0.39...v1.0.40) (2020-07-26)

### Bug Fixes

-   **android:** correctly handle semibold font ([a3bb69a](https://github.com/nativescript-community/ui-label/commit/a3bb69afcdcd6b6333adb72b2c63d7290f5564b0))

## [1.0.39](https://github.com/nativescript-community/ui-label/compare/v1.0.38...v1.0.39) (2020-05-28)

### Bug Fixes

-   **android:** another fix… ([731d643](https://github.com/nativescript-community/ui-label/commit/731d6435280dc34918a480aa0754d76be09ecfea))

## [1.0.38](https://github.com/nativescript-community/ui-label/compare/v1.0.37...v1.0.38) (2020-05-28)

### Bug Fixes

-   **android:** NPE fix ([079ab05](https://github.com/nativescript-community/ui-label/commit/079ab05b133d1f357dddb944295ef4ac2ea72e9d))

## [1.0.37](https://github.com/nativescript-community/ui-label/compare/v1.0.36...v1.0.37) (2020-05-28)

### Bug Fixes

-   **android:** NPE fix ([a50a314](https://github.com/nativescript-community/ui-label/commit/a50a31477d69453207284f05e3e1b429f12342e6))

## [1.0.36](https://github.com/nativescript-community/ui-label/compare/v1.0.35...v1.0.36) (2020-05-21)

**Note:** Version bump only for package @nativescript-community/ui-label

## [1.0.35](https://github.com/nativescript-community/ui-label/compare/v1.0.34...v1.0.35) (2020-05-21)

### Bug Fixes

-   sideEffects for tree shacking ([aeb8192](https://github.com/nativescript-community/ui-label/commit/aeb8192c1ebe251df27b6eea1deaacbe07c07719))

## [1.0.34](https://github.com/nativescript-community/ui-label/compare/v1.0.33...v1.0.34) (2020-05-21)

### Bug Fixes

-   esm using import for tree shaking ([764a64a](https://github.com/nativescript-community/ui-label/commit/764a64a473bf894328f1010af4bd66ddc674196e))

## [1.0.33](https://github.com/nativescript-community/ui-label/compare/v1.0.32...v1.0.33) (2020-05-21)

**Note:** Version bump only for package @nativescript-community/ui-label

## [1.0.32](https://github.com/nativescript-community/ui-label/compare/v1.0.31...v1.0.32) (2020-05-10)

### Bug Fixes

-   **android:** faster TextView creation ([e4a47a3](https://github.com/nativescript-community/ui-label/commit/e4a47a361ac474141732bc1d130a2cf8d86d1e26))

## [1.0.31](https://github.com/nativescript-community/ui-label/compare/v1.0.30...v1.0.31) (2020-05-08)

### Bug Fixes

-   **android:** fix some edge case font names ([7c0bcff](https://github.com/nativescript-community/ui-label/commit/7c0bcffeabbdd543c4c27a63964d7777bdd49a22))

## [1.0.30](https://github.com/nativescript-community/ui-label/compare/v1.0.29...v1.0.30) (2020-05-02)

### Bug Fixes

-   **android:** rewrote the html parser to make it faster ([8930751](https://github.com/nativescript-community/ui-label/commit/8930751ae19010c3727f3a839acbc4bd51d5beca))

## [1.0.29](https://github.com/nativescript-community/ui-label/compare/v1.0.28...v1.0.29) (2020-05-01)

### Bug Fixes

-   **android:** custom fromHTML to add more tags support ([b89d3a8](https://github.com/nativescript-community/ui-label/commit/b89d3a80b9368239c09c703a83b6540b346c5153))

## [1.0.28](https://github.com/nativescript-community/ui-label/compare/v1.0.27...v1.0.28) (2020-04-29)

### Bug Fixes

-   same as before but with fontName ([8b32d51](https://github.com/nativescript-community/ui-label/commit/8b32d51945f964ca8ed349f78a07668e08d058ab))
-   use this fontSize to ensure correct size event if font not updated yet ([603921d](https://github.com/nativescript-community/ui-label/commit/603921d7438fb1e9a14475ba7bf939cc5e950cff))

## [1.0.27](https://github.com/nativescript-community/ui-label/compare/v1.0.26...v1.0.27) (2020-03-30)

### Bug Fixes

-   some bug fixes ([38c3927](https://github.com/nativescript-community/ui-label/commit/38c3927ef33fdb2040a9868e6056d07afdbed6d6))
-   **android:** use new textview class to fix multi lines ellipsize ([b3feeee](https://github.com/nativescript-community/ui-label/commit/b3feeee4f9a616123d3b8456c19161fbaca430d3))

## [1.0.26](https://github.com/nativescript-community/ui-label/compare/v1.0.25...v1.0.26) (2020-03-05)

### Bug Fixes

-   **android:** fix for now was breaking classes in spans ([fce58b1](https://github.com/nativescript-community/ui-label/commit/fce58b1a2ebafa7b59483e6be54b7002ef9970ce))
-   **android:** use textview for now (wrong measure) ([4b8ad6f](https://github.com/nativescript-community/ui-label/commit/4b8ad6f31534172a40068cc1da4c2fb0cddcd548))
-   **android:** wrong weight for spans ([8da7923](https://github.com/nativescript-community/ui-label/commit/8da792322f5318bf3b600567b166a7aa9e201229))

## [1.0.25](https://github.com/nativescript-community/ui-label/compare/v1.0.24...v1.0.25) (2020-03-04)

### Bug Fixes

-   **ios:** another fix ([ffd291d](https://github.com/nativescript-community/ui-label/commit/ffd291d5a4a1c92746c124ef33a3170346d4d777))

## [1.0.24](https://github.com/nativescript-community/ui-label/compare/v1.0.23...v1.0.24) (2020-03-04)

### Bug Fixes

-   **ios:** fix text not showing … ([e404d4b](https://github.com/nativescript-community/ui-label/commit/e404d4bd1dcbafa9fda525f6bad7c1d88d7715ae))

## [1.0.23](https://github.com/nativescript-community/ui-label/compare/v1.0.22...v1.0.23) (2020-03-02)

### Bug Fixes

-   only update nativeText when all props updates have been processed ([d73e2d0](https://github.com/nativescript-community/ui-label/commit/d73e2d02ccd4110aede95e9f0ffdfa32d12bc154))

## [1.0.22](https://github.com/nativescript-community/ui-label/compare/v1.0.21...v1.0.22) (2020-02-27)

**Note:** Version bump only for package @nativescript-community/ui-label

## [1.0.21](https://github.com/nativescript-community/ui-label/compare/v1.0.20...v1.0.21) (2020-02-26)

### Bug Fixes

-   **android:** fixed parsing of font family ([09412f2](https://github.com/nativescript-community/ui-label/commit/09412f2c5090798b61a12550beea6dd47571ee54))

## [1.0.20](https://github.com/nativescript-community/ui-label/compare/v1.0.19...v1.0.20) (2020-02-17)

### Bug Fixes

-   **android:** support center verticalTextAlignment ([1d61b8c](https://github.com/nativescript-community/ui-label/commit/1d61b8c3d3221a60a84f63b05405d9e82aefe664))

## [1.0.19](https://github.com/nativescript-community/ui-label/compare/v1.0.18...v1.0.19) (2020-02-17)

### Bug Fixes

-   **android:** correctly set font ([82a4af7](https://github.com/nativescript-community/ui-label/commit/82a4af77013f7f88ffaf034062a6f51a71cf39ad))
-   **android:** span should not use parent background color ([e4c9eda](https://github.com/nativescript-community/ui-label/commit/e4c9edaf7027e530a1f8bf77d46b2ae12fb13032))
-   **ios:** apply settings to attributedString ([5f90cdc](https://github.com/nativescript-community/ui-label/commit/5f90cdc7a39b5ecfcc99bbb363ce6e6e45b22935))
-   some spans fixes ([c9fd367](https://github.com/nativescript-community/ui-label/commit/c9fd367e570f24cf7d1d93d8155254f9973751b2))

## [1.0.18](https://github.com/nativescript-community/ui-label/compare/v1.0.17...v1.0.18) (2020-02-14)

### Bug Fixes

-   span/formattedstring fixes for ios too ([755c612](https://github.com/nativescript-community/ui-label/commit/755c612d9880f4e0d8eca3279ac953aaa686417a))
-   **android:** a lot of improvements ([37c8df8](https://github.com/nativescript-community/ui-label/commit/37c8df8082168f6ebba215584372b0145b9740bd))
-   **ios:** dont use DTCoreText anymore ([9895c56](https://github.com/nativescript-community/ui-label/commit/9895c56e52f1aa76179ffaba1ed83440606e5574))

## [1.0.17](https://github.com/nativescript-community/ui-label/compare/v1.0.16...v1.0.17) (2020-02-12)

### Bug Fixes

-   **android:** full rewrite to improve perfs ([45663b8](https://github.com/nativescript-community/ui-label/commit/45663b81ea7f4e112d2ccddf2607e3cea04dd19b))

## [1.0.16](https://github.com/nativescript-community/ui-label/compare/v1.0.15...v1.0.16) (2020-02-11)

### Bug Fixes

-   **android:** starting android label rewrite ([36badf8](https://github.com/nativescript-community/ui-label/commit/36badf821b4d0f4cbde45c85e5d18ab5bc588d72))

## [1.0.15](https://github.com/nativescript-community/ui-label/compare/v1.0.14...v1.0.15) (2020-02-07)

### Bug Fixes

-   cleanup and profilng ([ada9a42](https://github.com/nativescript-community/ui-label/commit/ada9a42c58d8ada3024c38d901e49752eaa0593e))

## [1.0.14](https://github.com/nativescript-community/ui-label/compare/v1.0.13...v1.0.14) (2019-10-18)

### Bug Fixes

-   remove log ([aea16e2](https://github.com/nativescript-community/ui-label/commit/aea16e297437804cce45008f08d60680af380870))

## [1.0.13](https://github.com/nativescript-community/ui-label/compare/v1.0.12...v1.0.13) (2019-10-16)

### Bug Fixes

-   typings ([2fea2a1](https://github.com/nativescript-community/ui-label/commit/2fea2a102e18f57d9722e7a15bcee87dde574a6c))

## [1.0.12](https://github.com/nativescript-community/ui-label/compare/v1.0.11...v1.0.12) (2019-10-16)

### Bug Fixes

-   multiple fixes ([ae06cb1](https://github.com/nativescript-community/ui-label/commit/ae06cb14e549be5f80c95354cdbe6e496ad01503))

## [1.0.11](https://github.com/nativescript-community/ui-label/compare/v1.0.10...v1.0.11) (2019-08-22)

### Bug Fixes

-   ios border fix ([3e13d95](https://github.com/nativescript-community/ui-label/commit/3e13d95))

## [1.0.10](https://github.com/nativescript-community/ui-label/compare/v1.0.9...v1.0.10) (2019-08-02)

### Bug Fixes

-   ios typo ([afdc378](https://github.com/nativescript-community/ui-label/commit/afdc378))
-   missing typings ([cfe2be4](https://github.com/nativescript-community/ui-label/commit/cfe2be4))
-   typo fix ([708190b](https://github.com/nativescript-community/ui-label/commit/708190b))
-   use verticalTextAlignment instead of verticalAlignment ([a1e69f3](https://github.com/nativescript-community/ui-label/commit/a1e69f3))
-   use verticalTextAlignment instead of verticalAlignment ([3a11873](https://github.com/nativescript-community/ui-label/commit/3a11873))

## [1.0.9](https://github.com/nativescript-community/ui-label/compare/v1.0.8...v1.0.9) (2019-07-29)

### Bug Fixes

-   lint fix ([205972c](https://github.com/nativescript-community/ui-label/commit/205972c))
-   some ios fixes and optimisations ([195caa1](https://github.com/nativescript-community/ui-label/commit/195caa1))

### Features

-   support verticalAlignment ([ba87f09](https://github.com/nativescript-community/ui-label/commit/ba87f09))

## [1.0.8](https://github.com/nativescript-community/ui-label/compare/v1.0.7...v1.0.8) (2019-07-12)

### Bug Fixes

-   ios fix ([896aa1e](https://github.com/nativescript-community/ui-label/commit/896aa1e))

## 1.0.7 (2019-07-12)

### Bug Fixes

-   arrow function context ([23fbdbf](https://github.com/nativescript-community/ui-label/commit/23fbdbf))
-   ios and android fix ([c003061](https://github.com/nativescript-community/ui-label/commit/c003061))
-   remove unused dep ([cddd627](https://github.com/nativescript-community/ui-label/commit/cddd627))
