import React from "react";
import { AppViewModel } from "@/components/App/viewmodel";
import { observer } from "mobx-react";
import { Fab, Grid } from "@mui/material";
import { CallEnd, Phone } from "@mui/icons-material";

@observer
export class App extends React.Component {
    private model = new AppViewModel();

    componentDidMount() {
        window.addEventListener("beforeunload", this.model.terminate);
        this.model.video.current!.onmouseup = this.model.onVideoMouse("mouse_up");
        this.model.video.current!.onmousedown = this.model.onVideoMouse("mouse_down");
        this.model.video.current!.onmousemove = this.model.onVideoMouse("mouse_move");
        this.model.video.current!.onwheel = this.model.onVideoWheel;
        document.onkeydown = this.model.onKeyAction("key_down");
        document.onkeyup = this.model.onKeyAction("key_up");
        document.oncontextmenu = () => false;
    }

    componentWillUnmount() {
        this.model.terminate();
    }

    render() {
        return (
            <Grid
                container
                flexDirection={"column"}
                width={"100vw"}
                height={"100vh"}
                overflow={"hidden"}
                style={{background: "black"}}
            >
                <Grid container justifyContent={"center"} flexGrow={1}>
                    <video
                        ref={this.model.video}
                        autoPlay
                        muted
                        style={{
                            maxHeight: this.model.isHiding ? "100vh" : "calc(100vh - 110px)",
                            maxWidth: "100vw",
                            height: "100%",
                            width: "100%",
                        }}
                    />
                </Grid>
                <Grid
                    container
                    justifyContent={"center"}
                    alignItems={"center"}
                    padding={3}
                    width={"100%"}
                    hidden={this.model.isHiding}
                >
                    <Fab
                        onClick={this.model.hasJoined ? this.model.leave : this.model.join}
                        color={this.model.hasJoined ? "error" : "success"}
                    >
                        {this.model.hasJoined ? <CallEnd/> : <Phone/>}
                    </Fab>
                </Grid>
            </Grid>
        );
    }
}
