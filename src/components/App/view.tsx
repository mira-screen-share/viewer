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
        this.model.video.current!.onclick = this.model.onVideoClick;
        this.model.video.current!.onwheel = this.model.onVideoWheel;
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
                <Grid flexGrow={1}>
                    <video
                        ref={this.model.video}
                        autoPlay
                        muted
                        style={{
                            maxHeight: "calc(100vh - 110px)",
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
