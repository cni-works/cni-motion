(function (window) {
	'use strict';

	function stripComments(css) {
		var output = '', quote = '', index, end, character;
		for (index = 0; index < css.length; index++) {
			character = css[index];
			if (quote) {
				output += character;
				if (character === '\\' && index + 1 < css.length) output += css[++index];
				else if (character === quote) quote = '';
				continue;
			}
			if (character === '"' || character === "'") { quote = character; output += character; continue; }
			if (character === '/' && css[index + 1] === '*') {
				end = css.indexOf('*/', index + 2);
				if (end === -1) return null;
				output += ' '; index = end + 1; continue;
			}
			output += character;
		}
		return quote ? null : output;
	}

	function findBrace(css, start, closing) {
		var quote = '', round = 0, square = 0, depth = closing ? 1 : 0, index, character;
		for (index = start; index < css.length; index++) {
			character = css[index];
			if (quote) {
				if (character === '\\') index++;
				else if (character === quote) quote = '';
				continue;
			}
			if (character === '"' || character === "'") quote = character;
			else if (closing && character === '{') depth++;
			else if (closing && character === '}' && --depth === 0) return index;
			else if (!closing && character === '(') round++;
			else if (!closing && character === ')') round--;
			else if (!closing && character === '[') square++;
			else if (!closing && character === ']') square--;
			else if (!closing && character === '}') return -1;
			else if (!closing && character === '{' && round === 0 && square === 0) return index;
			if (round < 0 || square < 0) return -1;
		}
		return -1;
	}

	function splitSelectors(value) {
		var parts = [], start = 0, quote = '', round = 0, square = 0, index, character;
		for (index = 0; index < value.length; index++) {
			character = value[index];
			if (quote) {
				if (character === '\\') index++;
				else if (character === quote) quote = '';
				continue;
			}
			if (character === '"' || character === "'") quote = character;
			else if (character === '(') round++;
			else if (character === ')') round--;
			else if (character === '[') square++;
			else if (character === ']') square--;
			else if (character === ',' && round === 0 && square === 0) { parts.push(value.slice(start, index)); start = index + 1; }
			if (round < 0 || square < 0) return null;
		}
		if (quote || round !== 0 || square !== 0) return null;
		parts.push(value.slice(start));
		return parts;
	}

	function hasSiblingCombinator(value) {
		var quote = '', round = 0, square = 0, index, character;
		for (index = 0; index < value.length; index++) {
			character = value[index];
			if (quote) {
				if (character === '\\') index++;
				else if (character === quote) quote = '';
				continue;
			}
			if (character === '"' || character === "'") quote = character;
			else if (character === '(') round++;
			else if (character === ')') round--;
			else if (character === '[') square++;
			else if (character === ']') square--;
			else if (round === 0 && square === 0 && (character === '+' || character === '~')) return true;
		}
		return false;
	}

	function compileSelectors(value, scope, targets) {
		var parts = splitSelectors(value), output = [];
		if (!parts || !parts.length) return null;
		for (var index = 0; index < parts.length; index++) {
			var selector = parts[index].trim();
			if (!/^selector(?=$|[\s>.#:\[])/i.test(selector)) return null;
			var remainder = selector.slice('selector'.length);
			if (hasSiblingCombinator(remainder) || /\bselector\b/i.test(remainder)) return null;
			output.push(scope + remainder);
			if (targets) targets.push(remainder);
		}
		return output.join(',');
	}

	function compileRules(css, scope, allowMedia, targets) {
		var output = '', index = 0, open, close, prelude, body, nested, selectors;
		while (index < css.length) {
			while (index < css.length && /\s/.test(css[index])) index++;
			if (index >= css.length) break;
			open = findBrace(css, index, false);
			if (open === -1) return null;
			prelude = css.slice(index, open).trim();
			close = findBrace(css, open + 1, true);
			if (!prelude || close === -1) return null;
			body = css.slice(open + 1, close);
			if (prelude[0] === '@') {
				if (!allowMedia || !/^@media\s+[a-z0-9\s():.,\/%<>=_-]+$/i.test(prelude)) return null;
				nested = compileRules(body, scope, false, targets);
				if (!nested) return null;
				output += prelude + '{' + nested + '}';
			} else {
				if (body.indexOf('{') !== -1 || body.indexOf('}') !== -1 || !body.trim()) return null;
				selectors = compileSelectors(prelude, scope, targets);
				if (!selectors) return null;
				output += selectors + '{' + body.trim() + '}';
			}
			index = close + 1;
		}
		return output;
	}

	function compileDetails(css, scope) {
		var targets = [], compiled;
		if (typeof css !== 'string' || !css.trim() || css.length > 20000) return null;
		if (!/^\.[a-z][a-z0-9-]{7,48}$/.test(scope)) return null;
		if (/<|\u0000|@\s*(?:import|font-face|namespace|keyframes)\b|expression\s*\(|javascript\s*:/i.test(css)) return null;
		css = stripComments(css);
		if (css === null) return null;
		compiled = compileRules(css, scope, true, targets);
		return compiled === null ? null : {css:compiled,targets:targets};
	}

	function compile(css, scope) {
		var details = compileDetails(css, scope);
		return details ? details.css : null;
	}

	function inspect(css, scope, node) {
		var details = compileDetails(css, scope), matched = [], measurable = 0;
		if (!details) return null;
		if (!node || typeof node.querySelectorAll !== 'function') return {css:details.css,matchCount:null,measurableTargets:0};
		details.targets.forEach(function (remainder) {
			var nodes, selector;
			if (/:\s*(?:hover|active|focus|focus-within|focus-visible|visited)\b/i.test(remainder)) return;
			measurable++;
			if (!remainder) { if (matched.indexOf(node) === -1) matched.push(node); return; }
			selector = ':scope' + remainder;
			try { nodes = node.querySelectorAll(selector); }
			catch (error) { measurable--; return; }
			Array.prototype.forEach.call(nodes,function (item) { if (matched.indexOf(item) === -1) matched.push(item); });
		});
		return {css:details.css,matchCount:matched.length,measurableTargets:measurable};
	}

	window.CNIMotionCustomCssPreviewAPI = { compile: compile, inspect: inspect };
}(window));
