import React from "react";
import { AppViewModel } from "@/components/App/viewmodel";

export class App extends React.Component {
    private model = new AppViewModel();

    render() {
        return (
            <div>
                <video autoPlay muted ref={this.model.video}/>
                <input
                    type="button"
                    onClick={this.model.join}
                    value="Join"
                />
            </div>
        );
    }
}
