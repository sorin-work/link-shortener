import { render } from 'preact';
import { App } from './app';
import './styles.css';
import { applyTheme, storedTheme } from './theme';

applyTheme(storedTheme());

render(<App />, document.getElementById('app')!);
