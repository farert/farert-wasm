<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "M18 6 7 17l-5-5" }], ["path", { "d": "m22 10-7.5 7.5L13 16" }]];
</script>

<Icon name="check-check" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
