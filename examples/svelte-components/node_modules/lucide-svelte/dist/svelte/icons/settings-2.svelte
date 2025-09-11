<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "M20 7h-9" }], ["path", { "d": "M14 17H5" }], ["circle", { "cx": "17", "cy": "17", "r": "3" }], ["circle", { "cx": "7", "cy": "7", "r": "3" }]];
</script>

<Icon name="settings-2" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
