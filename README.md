# reddit-video-maker

A npm package to download videos from subreddits and cut them together
 
## Usage

### CLI

```
Usage: reddit-video-maker [options]

Options:
  -o,--output <path>               required: path to store video
  -i,--input <path>                required: path to config file
  -ffmpeg-path <path>              required: path to ffmpeg executable
  -r,--subreddits <subreddits...>  subreddits to get videos from. If set will
                                   ignore categories and subreddits in config
  --category                       category of subreddits to use from config.
                                   Chooses randomly by default
  --tempDir                        required: Directory where temporary video
                                   files should be saved
  --minLength <length>             required: minimum length of videos to
                                   include in seconds
  --resolution <resolution>        required: resolution of finally video
  --targetVideoLength <length>     required: target length of videos in seconds
  --maxLength <length>             required: minimum length of videos to
                                   include in seconds
  -h,--hideUsed                    required: call reddit api to hide found
                                   videos so they won't be reused again
  --includeHidden                  required: include hidden files in search for
                                   videos
  --verbose                        verbose logging
  --debug                          debug logging
  --help                           display help for command

```

Alternativly you can use a config file. Pass the path to the config file with the ``-i, --input`` option.

``config.example.json``:

```
{
	
  "ffmpegPath": "path/to/ffmpeg",
  "output": "./output.mp4",
  "subreddits": ["funny", "pics", "aww", "gifs"],
  "categories": {
    "funny": ["dankvideos", "memes"]
  },
  "category": "funny",
  "minLength": 0,
  "maxLength": 30,
  "targetVideoLength": 300,
  "hideUsed": true,
  "includeHidden": false,
  "tempDir": "./dsdsd/",
  "redditClientId": "clientId",
  "redditClientSecret": "clientSecret",
  "redditUsername": "username",
  "redditPassword": "password"
}
```

if a category is specified it will ignore the subreddits key.

### JS/TS

Import the function and call with options. You can once again specify a config by putting a path to it in the ``input`` key. 

Returns a Promise that if it resolves saved the output at the paths specified in the ``output`` key.

```
import {makeRedditCompilation} from "TODO:PACKAGENAME"

makeRedditCompilation({
  ffmpegPath: "",
  input: "",
  output: "",
  subreddits: [""],
  category: "",
  minLength: 0,
  maxLength: 0,
  targetVideoLength: 0,
  resolution: "",
  hideUsed: false,
  includeHidden: false,
  tempDir: "",
  redditClientId: "",
  redditClientSecret: "",
  redditUsername: "",
  redditPassword: "",
  logging: false,
  debug: false,
})
```

## Options Descriptions

TODO

## TODO

- Update readme
- Optimise speed a little bit. Maybe change the concat to not do a reencoding
- Make the padding look nicer instead of black color