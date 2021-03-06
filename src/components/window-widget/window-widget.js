import React, { Component } from 'react';
import { getImageById } from "../../store/helpers/relations";
import render from '../../services/render-dot';
import './styles.css';

const { remote, ipcRenderer } = window.require('electron');

class WindowScore extends Component {
    state = {
        layer: null
    };

    interval = null;

    constructor(props) {
        super( props );

        this.id = this.props.location.hash.substr( 1 );

        remote.getCurrentWindow().on('close', () => {
            ipcRenderer.send('close-window', this.id);
        });
    }

    componentDidMount() {
        const widget = this.props.windows.widgets.find( w => +this.id === +w.id );
        this.renderLayers(widget);
    }

    componentDidUpdate(prevProps, prevState) {
        if(prevProps !== this.props) {
            const widget = this.props.windows.widgets.find( w => +this.id === +w.id );
            this.renderLayers(widget);
        }

        const size = remote.getCurrentWindow().getContentBounds();
        const widget = this.props.windows.widgets.find( w => +w.id === +this.id );
        if( size.width !== widget.width || size.height !== widget.height) {
            remote.getCurrentWindow().setContentSize(
                widget.width,
                widget.height,
                true
            );
        }
    }

    renderLayers(widget) {
        clearTimeout(this.interval);
        const layers = [];

        for(const layer of widget.layers) {
            const text = render(layer.text, {
                donate: this.props.currentState.donate,
                money: this.props.currentState.money,
                discount: this.props.discount,
                results: this.props.currentState.spinResults,
                state: this.props.currentState.state
            });
            const show = layer.condition?
                Object.entries(layer.condition).map(
                    ([key, value]) => value === null || this.props.currentState.state[key] === value
                ).reduce( (accumulator, currentValue) => accumulator && currentValue, true )
                :
                true;

            if(show) {
                layers.push({
                    ...layer,
                    component: (
                        <span
                            key={ layer.id }
                            className="widget-layer"
                            style={{
                                color: layer.color
                            }}
                        >
                        { text }
                        </span>
                    )
                })
            }
        }

        if(layers.length > 0) {
            this.setState({
                layer: layers[0].component
            });
        } else {
            this.setState({
                layer: null
            });
        }

        if(layers.length > 1) {
            this.changeLayer(layers, 1)
        }
    }

    changeLayer = (layers, index=0) => {
        clearTimeout(this.interval);

        this.interval = setTimeout(
            () => {
                this.setState({
                    layer: layers[index].component
                });
                index = (index + 1) % layers.length;
                this.changeLayer(layers, index);
            },
            layers.slice(index - 1)[0].duration * 1000
        );
    };

    render() {
        const widget = this.props.windows.widgets.find( w => +this.id === +w.id );

        return (
            <div
                className="window-widget"
                style={{
                    backgroundColor: widget.color,
                    borderColor: widget.color
                }}
            >
                {widget.bg &&
                    <img
                        className="window-widget-bg"
                        src={ 'file://' + getImageById(widget.bg).path }
                        alt="bg"
                    />
                }
                <span className="widget-scoreboard">
                    { this.state.layer }
                </span>
            </div>
        );
    }
}

export default WindowScore;