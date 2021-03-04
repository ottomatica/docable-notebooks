# Embed Youtube videos

Embed a youtube video is possible by creating a docable cell. 

    ```|{type:'youtube', url: 'https://www.youtube.com/embed/bJiqrVWLfdw', start: 8, autoplay: true, mute: false, width: 800, height: 465}
    https://www.youtube.com/embed/bJiqrVWLfdw
    ```

The cell above will render as below:

```|{type:'youtube', url: 'https://www.youtube.com/embed/bJiqrVWLfdw', start: 8, autoplay: true, mute: false, width: 800, height: 465}
https://www.youtube.com/embed/bJiqrVWLfdw
```

#### Requirements: 
- The url must be the embed url for the video.
- `start`, `autoplay`, `mute`, `width`, and `height` properties are all optional.
- If url is included in the body of the code block, you may also omit the `url` property.

For example this can be another simpler code block to embed a youtube video:

    ```|{type:'youtube'}
    https://www.youtube.com/embed/bJiqrVWLfdw
    ```

```|{type:'youtube'}
https://www.youtube.com/embed/bJiqrVWLfdw
```
