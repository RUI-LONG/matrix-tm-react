import React from "react";
import Webcam from "react-webcam";
import Alert from '@material-ui/lab/Alert';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import NoteAddIcon from '@material-ui/icons/NoteAdd';
import ImageList from '@material-ui/core/ImageList';
import ImageListItem from '@material-ui/core/ImageListItem';
import GestureIcon from '@material-ui/icons/Gesture';
import VideocamOutlinedIcon from '@material-ui/icons/VideocamOutlined';
import { makeStyles } from '@material-ui/core/styles';
import Drawing from "./draw/Draw";

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%'
  },
  imageList: {
    maxHeight: '300px',
    overflowY: 'auto',
    transform: 'translateZ(0)'
  },
  image: {
    height: '100%',
    maxWidth: '100%'
  }
}));


function WebcamCapture(props) {

  const webcamRef = React.useRef(null);
  const [mouseHandler, setMouseHandler] = React.useState(1);

  const handleUpload = (e, imgSrc) => {
    props.onChange(e, imgSrc);
  }

  const handleMouseDown = (e) => {
    setMouseHandler(setTimeout(capture, 10, e));
    if (mouseHandler) {
      setMouseHandler(setTimeout(handleMouseDown, 50, e));
    }
  }

  const handleMouseUp = () => {
    clearTimeout(mouseHandler);
  }

  const capture = (e) => {
    const imageSrc = webcamRef.current.getScreenshot();
    handleUpload(e, imageSrc);
  };

  return (
    <Grid container direction="column" justifyContent="space-between" alignItems="stretch" >
      <Webcam
        audio={false}
        ref={webcamRef}
        id="webcam"
        screenshotFormat="image/jpeg"
        forceScreenshotSourceSize="true"
        width={224}
        style={{
          width: "100%"
        }}
      />
      <Button variant="contained" color="primary" size="medium" onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        Capture Photo
      </Button>
    </Grid>
  );
};

export default function Capture(props) {

  const classes = useStyles();

  const scrollRef = React.useRef();
  const [selectedFiles, setSelectedFiles] = React.useState([]);
  const [toggleWebcam, setToggleWebcam] = React.useState(false);
  const [toggleDraw, setToggleDraw] = React.useState(false);
  const [alertPerm, setAlertPerm] = React.useState(false);

  const handleWebcam = () => {
    props.onCameraOn();

    async function checkIsApproved() {
      let deviceInfo = await navigator.mediaDevices.enumerateDevices()

      // are there any permitted webcam devices on the list
      return [...deviceInfo].some(info => info.label !== "");
    }

    checkIsApproved().then(res => {
      if (res) {
        setAlertPerm(false);
        setToggleWebcam(prevState => !prevState);
      } else {
        setAlertPerm(true);
      }
    });
  };

  const handleDraw = () => {
    setToggleDraw(prevState => !prevState);
  };

  const handleUpload = (e, src) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).map(
        (file) => URL.createObjectURL(file)
      );

      setSelectedFiles((prevImages) => prevImages.concat(filesArray));
      Array.from(e.target.files).map(
        (file) => URL.revokeObjectURL(file) // avoid memory leak
      );
    } else if (src) {
      setSelectedFiles((prevImages) => prevImages.concat(src));
    }
  };

  const handleImageList = React.useCallback(() => {
    props.onChange(selectedFiles);
    setSelectedFiles(props.imageList);
  }, [props, selectedFiles]);

  const closeCamera = React.useCallback(() => {
    setToggleWebcam(false);
  }, []);

  React.useEffect(() => {
    if (props.captureEl) {
      props.captureEl.current = [handleImageList, closeCamera];
    }
  }, [props.captureEl, handleImageList, closeCamera])

  React.useEffect(() => {
    if (props.imageList) {
      setSelectedFiles(props.imageList);
    }
  }, [props.imageList])

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  })

  return (
    <Box className={classes.root} key={props.cardId}>
      <Grid container spacing={2} direction="row" justifyContent="space-between" alignItems="flex-start" >
        {toggleWebcam ? <Grid item xs={6}><WebcamCapture onChange={handleUpload} /></Grid> : null}
        {toggleDraw ? <Drawing /> : null}
        <Grid item xs={6} overflow="visible" >
          <Typography>
            Add Image Samples:
          </Typography>
          <ImageList className={classes.imageList} ref={scrollRef} rowHeight="auto" cols={4}>
            {selectedFiles.map((item) => (
              <ImageListItem key={item} cols={item.cols || 1}>
                <img className={classes.image} src={item} alt={item.title} />
              </ImageListItem>)
            )}
          </ImageList>
        </Grid>
      </Grid>
      <Box display="flex" pt={2}>
        <Box p={0.5}>
          <Button variant="outlined" size="large" color="primary" onClick={handleWebcam} startIcon={<VideocamOutlinedIcon />}>
            Webcam
          </Button>
        </Box>
        <Box p={0.5}>
          <Button variant="outlined" size="large" color="primary" onClick={handleDraw} startIcon={<GestureIcon />}>
            Draw
          </Button>
        </Box>
        <Box p={0.5}>
          <input id={props.cardId} accept="image/*" type="file" multiple hidden onChange={handleUpload} />
          <label htmlFor={props.cardId}>
            <Button variant="outlined" size="large" color="primary" component="span" startIcon={<NoteAddIcon />}>
              Upload
            </Button>
          </label>
        </Box>
      </Box>
      {alertPerm ?
        <div>
          <Alert onClose={() => { setAlertPerm(false) }} severity="error">
            You must grant this site to access your camera. Please check your privacy setting and try again.
          </Alert>
        </div> : null
      }
    </Box>
  );
};
