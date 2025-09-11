<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10" }], ["path", { "d": "m16 16 6-6" }], ["path", { "d": "m8 8 6-6" }], ["path", { "d": "m9 7 8 8" }], ["path", { "d": "m21 11-8-8" }]];
</script>

<Icon name="gavel" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
