<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "M2 20h.01" }], ["path", { "d": "M7 20v-4" }]];
</script>

<Icon name="signal-low" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
