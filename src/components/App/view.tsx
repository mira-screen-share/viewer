import React from "react";
import { AppViewModel } from "@/components/App/viewmodel";
import { observer } from "mobx-react";

@observer
export class App extends React.Component {
    private model = new AppViewModel();

    componentDidMount() {
        window.addEventListener("beforeunload", this.model.terminate);
    }

    componentWillUnmount() {
        this.model.terminate();
    }

    render() {
        return (
            <div>
                <video autoPlay muted ref={this.model.video}/>
                <input
                    type="button"
                    onClick={this.model.hasJoined ? this.model.leave : this.model.join}
                    value={this.model.hasJoined ? "Leave" : "Join"}
                />
            </div>
        );
    }
}
