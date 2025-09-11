<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "M2 20h.01" }]];
</script>

<Icon name="signal-zero" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
