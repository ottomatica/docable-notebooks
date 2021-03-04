# Embed Google Slides

Embed a google slide creating a docable cell. 

    ```|{type:'slides', height: 569, width: 960, url: 'https://docs.google.com/presentation/d/e/2PACX-1vSl94Tz9pRTwp1LTR6ImmHoHqd7kHiresyP-Ytq0HnPdjqdK38MtxMvr4agOykQPqDIQrixKtW27mlT/embed?start=true&loop=true&delayms=3000'}
    https://docs.google.com/presentation/d/e/2PACX-1vSl94Tz9pRTwp1LTR6ImmHoHqd7kHiresyP-Ytq0HnPdjqdK38MtxMvr4agOykQPqDIQrixKtW27mlT/embed?start=true&loop=true&delayms=3000
    ```

The cell above will render as shown below:

```|{type:'slides', height: 569, width: 960, url: 'https://docs.google.com/presentation/d/e/2PACX-1vSl94Tz9pRTwp1LTR6ImmHoHqd7kHiresyP-Ytq0HnPdjqdK38MtxMvr4agOykQPqDIQrixKtW27mlT/embed?start=true&loop=true&delayms=3000'}
https://docs.google.com/presentation/d/e/2PACX-1vSl94Tz9pRTwp1LTR6ImmHoHqd7kHiresyP-Ytq0HnPdjqdK38MtxMvr4agOykQPqDIQrixKtW27mlT/embed?start=true&loop=true&delayms=3000
```

#### Requirements: 
- The url must be the embed url for the slide.
- `width`, and `height` properties are optional.
- If url is included in the body of the code block, you may also omit the `url` property.

For example this can be another simpler code block to embed a youtube video:

    ```|{type:'slides'}
    https://docs.google.com/presentation/d/e/2PACX-1vSl94Tz9pRTwp1LTR6ImmHoHqd7kHiresyP-Ytq0HnPdjqdK38MtxMvr4agOykQPqDIQrixKtW27mlT/embed
    ```

```|{type:'slides'}
https://docs.google.com/presentation/d/e/2PACX-1vSl94Tz9pRTwp1LTR6ImmHoHqd7kHiresyP-Ytq0HnPdjqdK38MtxMvr4agOykQPqDIQrixKtW27mlT/embed
```


#### Getting embed URL for Google Slides
Please refer to [Google Docs help page](https://support.google.com/docs/answer/183965?hl=en#zippy=%2Cembed-a-document-spreadsheet-or-presentation).